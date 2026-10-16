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
 * Native Moodle administration settings.
 *
 * @package    local_sis_accessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_sis_accessibility', get_string('pluginname', 'local_sis_accessibility'));
    $ADMIN->add('localplugins', $settings);
    if ($ADMIN->fulltree) {
        foreach (['enabled', 'showlogin', 'showadmin', 'persist'] as $name) {
            $settings->add(new admin_setting_configcheckbox(
                'local_sis_accessibility/' . $name,
                get_string($name, 'local_sis_accessibility'),
                get_string($name . '_desc', 'local_sis_accessibility'),
                1
            ));
        }
        $settings->add(new \local_sis_accessibility\local\course_ids_setting(
            'local_sis_accessibility/excludedcourses',
            get_string('excludedcourses', 'local_sis_accessibility'),
            get_string('excludedcourses_desc', 'local_sis_accessibility'),
            '',
            PARAM_RAW_TRIMMED
        ));
        $tools = [];
        foreach (\local_sis_accessibility\local\configuration::TOOLS as $tool) {
            $tools[$tool] = get_string($tool, 'local_sis_accessibility');
        }
        $settings->add(new admin_setting_configmulticheckbox(
            'local_sis_accessibility/tools',
            get_string('tools', 'local_sis_accessibility'),
            get_string('tools_desc', 'local_sis_accessibility'),
            array_fill_keys(array_keys($tools), 1),
            $tools
        ));
        $positions = [];
        foreach (\local_sis_accessibility\local\configuration::POSITIONS as $position) {
            $positions[$position] = get_string('position_' . str_replace('-', '_', $position), 'local_sis_accessibility');
        }
        foreach (['position', 'mobileposition'] as $name) {
            $settings->add(new admin_setting_configselect(
                'local_sis_accessibility/' . $name,
                get_string($name, 'local_sis_accessibility'),
                '',
                'center-left',
                $positions
            ));
        }
        $defaults = [
            'size' => 56,
            'mobilesize' => 56,
            'offsetx' => 20,
            'offsety' => 20,
            'mobileoffsetx' => 12,
            'mobileoffsety' => 12,
        ];
        foreach ($defaults as $name => $default) {
            $size = strpos($name, 'size') !== false;
            $settings->add(new \local_sis_accessibility\local\bounded_int_setting(
                'local_sis_accessibility/' . $name,
                get_string($name, 'local_sis_accessibility'),
                get_string($size ? 'size_desc' : 'offset_desc', 'local_sis_accessibility'),
                $default,
                $size ? 48 : 0,
                $size ? 96 : 200
            ));
        }
        foreach (['colour' => '#0848CA', 'textcolour' => '#FFFFFF'] as $name => $default) {
            $settings->add(new admin_setting_configtext(
                'local_sis_accessibility/' . $name,
                get_string($name, 'local_sis_accessibility'),
                get_string('colour_desc', 'local_sis_accessibility'),
                $default,
                '/^#[a-fA-F0-9]{6}$/'
            ));
        }
    }
}
