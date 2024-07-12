import xml.etree.ElementTree as ET
import os
import sys
import subprocess

def convert_to_latin(text):
    # Replace Cyrillic characters with their Latin counterparts
    mapping = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '_',  # Replace spaces with underscores,
        '–': '_',
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8' : '8', '9': '9',
        '-': '_', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i',
        'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r', 's': 's',
        't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z'
    }
    return ''.join(mapping.get(c.lower(), '_') for c in text)

def process_xml(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    for cell in root.findall('.//mxCell'):
        value = cell.get('value')
        visible = cell.get('visible')
        if (visible != None):
            print(visible)

            latin_filename = convert_to_latin(value)
            cell.set('visible', '1')

            # Write modified XML to a new file
            new_filename = f"{latin_filename}.xml"
            with open(new_filename, 'wb') as f:
                tree.write(f)

            print(f"Created file: {new_filename}")

            cell.set('visible', '0')

            output_file = f"{latin_filename}.png"
            # curl_command = f'curl -d @{new_filename} -H "Accept: image/png" \'http://localhost:5000/convert_file?scale=3\' --output {output_file}'
            curl_command = f'/Applications/draw.io.app/Contents/MacOS/draw.io -x -f png --width 2000 -o {output_file} {new_filename}'
            subprocess.run(curl_command, shell=True)

            print(f"Converted {new_filename} to {output_file}")

            subprocess.run(f'rm "{new_filename}"', shell=True)

if __name__ == "__main__":
    xml_file = sys.argv[1]
    if os.path.exists(xml_file):
        process_xml(xml_file)
    else:
        print("XML file not found.")