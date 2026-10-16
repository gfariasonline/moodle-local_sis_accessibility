#!/usr/bin/env python3
"""Create an installable development ZIP using only this plugin's sources."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import argparse
import hashlib

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
args = parser.parse_args()
output = args.output.resolve()
files = sorted(p for p in root.rglob('*') if p.is_file() and
               not any(part.startswith('.') or part in ['node_modules', 'upstream-src'] for part in p.relative_to(root).parts) and
               p.name != 'VALIDACAO.md' and p.suffix != '.zip' and p.resolve() != output)
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in files:
        info = ZipInfo('sis_accessibility/' + path.relative_to(root).as_posix(), date_time=(2026, 10, 16, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, path.read_bytes())
with ZipFile(output) as archive:
    assert archive.testzip() is None
    for required in ['version.php', 'amd/build/init.min.js', 'amd/build/init.min.js.map', 'fonts/OpenDyslexic-Regular.woff2', 'pix/sis-logo.png', 'thirdparty/sienna/LICENSE', 'amd/build/aids.min.js', 'amd/build/icons.min.js',
                     'amd/build/profiles.min.js',
                     'thirdparty/icons/material/LICENSE', 'thirdparty/icons/lucide/LICENSE']:
        assert 'sis_accessibility/' + required in archive.namelist()
print(f'{output}: {len(files)} files, {output.stat().st_size} bytes')
print('SHA256 ' + hashlib.sha256(output.read_bytes()).hexdigest())
