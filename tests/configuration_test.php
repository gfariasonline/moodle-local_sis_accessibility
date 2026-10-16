<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Tests for the browser configuration boundary.
 *
 * @package    local_sis_accessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sis_accessibility;

use local_sis_accessibility\local\configuration;

/**
 * Verify the plugin boundary.
 *
 * @covers \local_sis_accessibility\local\configuration
 */
final class configuration_test extends \advanced_testcase {
    public function test_sanitises_arbitrary_settings(): void {
        $config = configuration::normalise((object) [
            'tools' => 'fontsize,unknown,links,fontsize', 'colour' => 'url(https://invalid.test)',
            'position' => 'fixed;top:0', 'size' => '9999', 'offsetx' => '-1',
        ]);
        $this->assertSame(['fontsize', 'links'], $config['tools']);
        $this->assertSame('#0848CA', $config['colour']);
        $this->assertSame('center-left', $config['position']);
        $this->assertSame(96, $config['size']);
        $this->assertSame(0, $config['offsetx']);
    }

    public function test_default_colours_are_sienna_blue_and_white(): void {
        $config = configuration::normalise(new \stdClass());
        $this->assertSame('#0848CA', $config['colour']);
        $this->assertSame('#FFFFFF', $config['textcolour']);
    }

    public function test_centre_and_corner_positions_are_accepted_with_centre_left_default(): void {
        $defaults = configuration::normalise(new \stdClass());
        $this->assertSame('center-left', $defaults['position']);
        $this->assertSame('center-left', $defaults['mobileposition']);
        foreach (['center-left', 'center-right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'] as $position) {
            $config = configuration::normalise((object) ['position' => $position, 'mobileposition' => $position]);
            $this->assertSame($position, $config['position']);
            $this->assertSame($position, $config['mobileposition']);
        }
        $invalid = configuration::normalise((object) ['position' => 'center', 'mobileposition' => 'top']);
        $this->assertSame('center-left', $invalid['position']);
        $this->assertSame('center-left', $invalid['mobileposition']);
    }

    public function test_empty_tool_selection_stays_empty(): void {
        $this->assertSame([], configuration::normalise((object) ['tools' => ''])['tools']);
        $this->assertSame(configuration::TOOLS, configuration::normalise(new \stdClass())['tools']);
    }

    public function test_course_ids_reject_invalid_input(): void {
        $this->assertSame([2, 13], configuration::course_ids('2, 13 2'));
        $this->expectException(\invalid_parameter_exception::class);
        configuration::course_ids('2,13oops');
    }

    public function test_scope_is_stable_and_rotates_for_account_changes(): void {
        $this->resetAfterTest();
        $this->setGuestUser();
        $guest = configuration::storage_scope();
        $this->assertSame($guest, configuration::storage_scope());
        $this->setUser($this->getDataGenerator()->create_user());
        $user = configuration::storage_scope();
        $this->assertNotSame($guest, $user);
        $this->assertSame($user, configuration::storage_scope());
        configuration::reset_scope();
        $this->assertNotSame($user, configuration::storage_scope());
        $this->assertMatchesRegularExpression('/^local_sis_accessibility:v1:[a-f0-9]{16}:[a-f0-9]{32}$/', $user);
    }

    public function test_client_payload_contains_only_public_values(): void {
        global $CFG;
        $this->resetAfterTest();
        $this->setGuestUser();
        $config = configuration::for_client(configuration::normalise((object) ['excludedcourses' => '12']));
        foreach (['enabled', 'showlogin', 'showadmin', 'excludedcourses', 'owner', 'userid'] as $privatekey) {
            $this->assertArrayNotHasKey($privatekey, $config);
        }
        $this->assertArrayNotHasKey('fonturl', $config);
        $this->assertSame((new \moodle_url('/local/sis_accessibility/pix/sis-logo.png'))->out(false), $config['logourl']);
        $this->assertCount(count(configuration::TOOLS) + count(configuration::LABELS), $config['labels']);
    }

    public function test_extended_tools_are_bundled_and_enabled_by_default(): void {
        foreach (['hideimages', 'imagetooltips'] as $tool) {
            $this->assertContains($tool, configuration::TOOLS);
        }
        $this->assertSame(array_values(array_unique(configuration::TOOLS)), configuration::TOOLS);
        $this->assertSame(configuration::TOOLS, configuration::normalise(new \stdClass())['tools']);
    }

    public function test_client_payload_carries_language_and_current_labels(): void {
        global $testlang;
        $this->resetAfterTest();
        $this->setGuestUser();
        $testlang = 'pt_br';
        try {
            $config = configuration::for_client(configuration::normalise(new \stdClass()));
        } finally {
            $testlang = null;
        }
        $this->assertSame('pt_br', $config['language']);
        $this->assertSame(['en' => 'English (en)', 'pt_br' => 'Português - Brasil (pt_br)'], $config['languages']);
        $this->assertArrayNotHasKey('readerurl', $config);
        foreach (['profilesgroup', 'language_pt_br', 'profile_seizure_safe_desc', 'hideimages', 'imagetooltips'] as $label) {
            $this->assertArrayHasKey($label, $config['labels']);
        }
    }

    public function test_removed_tools_and_labels_are_rejected_from_stored_configuration(): void {
        $removed = ['superfocus', 'pdfreader', 'pagestructure', 'screenreader'];
        $config = configuration::normalise((object) ['tools' => implode(',', array_merge($removed, ['links']))]);
        $this->assertSame(['links'], $config['tools']);
        $this->assertCount(18, configuration::TOOLS);
        foreach ($removed as $tool) {
            $this->assertNotContains($tool, configuration::TOOLS);
            $this->assertNotContains($tool, configuration::LABELS);
        }
        foreach (['profile_blind', 'profile_motor_impaired'] as $profile) {
            $this->assertNotContains($profile, configuration::LABELS);
        }
    }

    public function test_storage_keys_are_separate_for_installations_under_one_origin(): void {
        global $CFG;
        $this->resetAfterTest();
        $this->setGuestUser();
        $original = $CFG->wwwroot;
        try {
            $CFG->wwwroot = 'https://example.invalid/moodle-one';
            $first = configuration::storage_scope();
            $CFG->wwwroot = 'https://example.invalid/moodle-two';
            $this->assertNotSame($first, configuration::storage_scope());
        } finally {
            $CFG->wwwroot = $original;
        }
    }
    public function test_button_foreground_is_adjusted_to_wcag_contrast(): void {
        foreach ([['#FF7A00', '#FFFFFF', '#000000'], ['#111111', '#000000', '#FFFFFF'],
                ['#FFFFFF', '#191919', '#191919']] as [$background, $foreground, $expected]) {
            $config = configuration::normalise((object) ['colour' => $background, 'textcolour' => $foreground]);
            $this->assertSame($background, $config['colour']);
            $this->assertSame($expected, $config['textcolour']);
            $this->assertGreaterThanOrEqual(4.5, configuration::contrast_ratio($config['colour'], $config['textcolour']));
        }
    }

    public function test_language_list_never_empty(): void {
        global $testlanguages;
        $testlanguages = [];
        try {
            $this->assertSame(['fr' => 'fr'], configuration::installed_languages('fr'));
        } finally {
            $testlanguages = null;
        }
    }

    public function test_html_configuration_round_trips_without_raw_html_tags(): void {
        $this->resetAfterTest();
        $this->setGuestUser();
        $context = configuration::template_context(configuration::normalise(new \stdClass()));
        $data = json_decode($context['config'], true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(configuration::TOOLS, $data['tools']);
        $this->assertSame(configuration::storage_scope(), $data['scope']);
        $this->assertStringNotContainsString('<', $context['config']);
        $this->assertStringNotContainsString('>', $context['config']);
    }
}
