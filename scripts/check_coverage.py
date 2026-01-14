# Script para verificar cobertura 100%
import xml.etree.ElementTree as ET
import sys

COVERAGE_FILE = 'coverage.xml'

try:
    tree = ET.parse(COVERAGE_FILE)
    root = tree.getroot()
    line_rate = float(root.attrib.get('line-rate', 0))
    total_lines = int(root.attrib.get('lines-valid', 0))
    covered_lines = int(root.attrib.get('lines-covered', 0))
    if line_rate == 1.0 or covered_lines == total_lines:
        print('✅ Cobertura 100% alcanzada.')
        sys.exit(0)
    else:
        print(f'❌ Cobertura insuficiente: {covered_lines}/{total_lines} líneas ({line_rate*100:.2f}%)')
        sys.exit(1)
except Exception as e:
    print(f'Error al leer coverage.xml: {e}')
    sys.exit(2)
