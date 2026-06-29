### requirements
- Need a system to generate entrance oriented question papers to prepare exams like JEE, KEAM (Kerala Engineering Architecture Medical)
- The questions are object oriented questions with options
- Need a system to store the questions in database
  - There should be a way to import questions and save it in a database
  - With answer and solutions
- The system will be able to create question paper out of this stored questions from database based on some conditions
  - input - no of questions, time for each question, mark for correct and answer, negative mark for wrong answer
  - output - question paper with no of questions as above and total time based on the time for each question
  - There should be general instructions like total time, no of questions, subject, chapter etc
  - The academy name is 'ASR Entrance Academy' and can be used in title.

### Implementation
- Let's start with the database import implementation first
- subjects I'm thinking now are maths, physics and chemistry
- only objective type questions
- Thinking of using llms to create questions from image to a required json format for import, need prompt for that
