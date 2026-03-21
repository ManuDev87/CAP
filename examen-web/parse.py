import json
import re

def parse_exam(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by question numbers: 1., 2., ...
    # We look for a newline followed by digits and a dot, and then optional space,
    # and then an uppercase letter or an opening question mark.
    questions_raw = re.split(r'\n(?=\d+\.\s*[A-ZÁÉÍÓÚ¿])', '\n' + content)
    questions = []

    for q_raw in questions_raw:
        if not q_raw.strip():
            continue
        
        lines = [line.strip() for line in q_raw.strip().split('\n') if line.strip()]
        if not lines:
            continue
            
        question_text = ''
        options = []
        correct_answer = None
        
        i = 0
        # Parse question text
        while i < len(lines):
            line = lines[i]
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
                # so the option parser loop below will catch it
                lines[i] = line[match.start():].strip()
                break

            question_text += line + ' '
            i += 1
            
        question_text = question_text.strip()
        
        # Parse options
        while i < len(lines):
            line = lines[i]
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
            question_text = re.sub(r'^\d+\.\s*', '', question_text)
            
            questions.append({
                'num': q_raw.split('.')[0].strip(),
                'question': question_text,
                'options': options,
                'correct': correct_answer
            })
        else:
            print(f"Failed to parse question starting with: {q_raw[:30]}...")
            
    return questions

for exam in ['septiembre_2024', 'noviembre_2024']:
    questions = parse_exam(f'{exam}.txt')
    with open(f'data_{exam}.js', 'w', encoding='utf-8') as f:
        f.write(f'const examData_{exam} = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';')
    print(f'Successfully parsed {len(questions)} questions for {exam}.')

parsed_nums = []
for q in questions:
    try:
        num = int(q['num'])
        parsed_nums.append(num)
    except:
        pass
missing = [n for n in range(1, 104) if n not in parsed_nums]
if missing:
    print("Missing questions:", missing)
else:
    print("All 103 questions parsed successfully.")
