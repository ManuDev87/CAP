import json
import re

def clean_and_parse(txt_path, js_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the header/footer patterns to remove
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        # Skip page number lines
        if re.match(r'^Página\s+\d+\s+de\s+\d+$', stripped, re.IGNORECASE):
            continue
        # Skip exam header lines
        if 'EXAMEN OBTENCIÓN DEL CAP' in stripped:
            continue
        if stripped.startswith('Fecha:') and 'Examen:' in stripped:
            continue
        if stripped.startswith('Lugar:') and 'Duración:' in stripped:
            continue
        cleaned_lines.append(line)

    cleaned_content = '\n'.join(cleaned_lines)

    # Split by question numbers: 1., 2., ...
    # We look for a newline followed by digits and a dot, and then optional space,
    # and then an uppercase letter or an opening question mark.
    questions_raw = re.split(r'\n(?=\d+\.\s*[A-ZÁÉÍÓÚ¿])', '\n' + cleaned_content)
    questions = []

    for q_raw in questions_raw:
        if not q_raw.strip():
            continue
        
        q_lines = [line.strip() for line in q_raw.strip().split('\n') if line.strip()]
        if not q_lines:
            continue
            
        question_text = ''
        options = []
        correct_answer = None
        
        i = 0
        # Parse question text
        while i < len(q_lines):
            line = q_lines[i]
            # If line is exactly an option like a), * a), * b), b), etc.
            if re.match(r'^\*?\s*[a-d]\)', line.lower()):
                break
            
            # Handle the case where option 'a)' is appended to the question on the same line
            match = re.search(r'(?:\s+)(\*?\s*a\)\s*.*)', line.lower())
            if match:
                # Extract the question part
                real_question_part = line[:match.start()]
                question_text += real_question_part + ' '
                
                # The remainder is the 'a)' option, we put it back in the list
                q_lines[i] = line[match.start():].strip()
                break

            question_text += line + ' '
            i += 1
            
        question_text = question_text.strip()
        
        # Parse options
        while i < len(q_lines):
            line = q_lines[i]
            if line.startswith('Referencia'):
                break
                
            # It might be an option
            if re.match(r'^\*?\s*[A-Da-d]\)', line):
                is_correct = line.startswith('*')
                opt_letter = re.search(r'([A-Da-d])\)', line).group(1).lower()
                opt_text = re.sub(r'^\*?\s*[A-Da-d]\)\s*', '', line).strip()
                
                options.append({
                    'id': opt_letter,
                    'text': opt_text
                })
                
                if is_correct:
                    correct_answer = opt_letter
                    
            elif len(options) > 0:
                # Continuation of previous option
                options[-1]['text'] += ' ' + line
                
            i += 1
            
        if question_text and options and correct_answer:
            # Clean up question text (remove number at the start)
            q_num_match = re.match(r'^(\d+)\.', q_raw.strip())
            q_num = q_num_match.group(1) if q_num_match else q_raw.split('.')[0].strip()
            
            question_text = re.sub(r'^\d+\.\s*', '', question_text)
            
            questions.append({
                'num': q_num,
                'question': question_text,
                'options': options,
                'correct': correct_answer
            })
        else:
            print(f"Failed to parse question starting with: {q_raw[:40]}...")
            
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('const examData_mayo_2026 = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';')
    print(f'Successfully parsed {len(questions)} questions.')
    
    parsed_nums = []
    for q in questions:
        try:
            num = int(q['num'])
            parsed_nums.append(num)
        except Exception as e:
            print("Error parsing num:", q['num'], e)
            
    missing = [n for n in range(1, 104) if n not in parsed_nums]
    if missing:
        print("Missing questions:", missing)
    else:
        print("All 103 questions parsed successfully.")

if __name__ == '__main__':
    clean_and_parse(
        r'c:\Users\manue\Desktop\CAP\examen-web\python\mayo_2026.txt',
        r'c:\Users\manue\Desktop\CAP\examen-web\data\data_mayo_2026.js'
    )
