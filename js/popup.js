async function saveTextAsZippedXml(text, filename) {
    if (!filename.endsWith(".zip")) {
      filename += ".zip";
    }
  
    // 1. Create the XML string.
    const xmlString = `${text}`;
  
    // 2. Create a Blob from the XML string.
    const xmlBlob = new Blob([xmlString], { type: 'application/xml' });
  
    // 3. Use a library like JSZip to create a ZIP archive.
    const zip = new JSZip();
  
    // 4. Add the XML Blob to the ZIP archive with a suitable name.
    //    Crucially, make sure the filename in the zip ends with '.xml'
    zip.file("data.xml", xmlBlob); // Or any other appropriate filename inside the ZIP.
  
    // 5. Generate the ZIP file content (as a Blob).
    const zipBlob = await zip.generateAsync({ type: "blob" });
  
    // 6. Create a download link and trigger the download.
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = filename;  // Set the desired filename for the downloaded file.
    document.body.appendChild(downloadLink); // Append to the DOM (required for Firefox).
    downloadLink.click();
    document.body.removeChild(downloadLink); // Clean up the link element.
    URL.revokeObjectURL(downloadLink.href); // Important to release the Blob URL.
  }
  
  function getTextareaAsJSON() {
    // 1. Get the textarea element.
    const textarea = document.getElementById("story"); // Replace 'myTextarea' with the actual ID of your textarea.
  
    if (!textarea) {
      console.error("Textarea element not found.");
      return null; // Or throw an error, depending on how you want to handle it.
    }
  
    // 2. Get the text content from the textarea.
    const text = textarea.value;
  
    // 3. Parse the text (assuming it's already in a valid, JSON-like format).
    //    IMPORTANT: This is where the error handling is CRUCIAL.  Text from a textarea
    //    is *user input* and therefore likely to be invalid JSON.  You MUST handle parsing errors.
  
    try {
      const json = JSON.parse(text);
      return json;
    } catch (error) {
      console.error("Invalid JSON in textarea:", error);
      alert("The text in the textarea is not valid JSON. Please check the format."); // User-friendly feedback.
      return null;  // Or handle the error as appropriate (e.g., return an empty object, etc.).
    }
  }
  
  function convertJsonToQTI(jsonData, quizTitle = "Quiz Title") {
    let qtiXML = `<?xml version="1.0" encoding="UTF-8"?>
  <questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="quiz_assessment" title="${quizTitle}">
    <section ident="section_1">`;
  
    jsonData.forEach((questionData, questionIndex) => {
        const itemId = `item_${questionIndex + 1}`;
        const responseId = `response_${questionIndex + 1}`;
        const correctResponseIndex = questionData.correct_answer;
  
        qtiXML += `
      <item ident="${itemId}">
        <itemmetadata>
          </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/plain">${questionData.q}</mattext>
          </material>
          <response_lid ident="${responseId}" rcardinality="Single" rtype="Choice">
            <render_choice>
              `;
  
        questionData.answers.forEach((answer, answerIndex) => {
            const choiceId = `choice_${itemId}_${String.fromCharCode(65 + answerIndex)}`; // choice_item_1_A, choice_item_1_B, etc.
            qtiXML += `
              <response_label ident="${choiceId}">
                <material>
                  <mattext texttype="text/plain">${answer}</mattext>
                </material>
              </response_label>
              `;
        });
  
        qtiXML += `
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar varname="SCORE" vartype="Integer" defaultval="0"/>
          </outcomes>
          <respcondition>
            <conditionvar>
              <varequal respident="${responseId}">${`choice_${itemId}_${String.fromCharCode(65 + correctResponseIndex)}`}</varequal>
            </conditionvar>
            <setvar varname="SCORE" action="Add">1</setvar>
          </respcondition>
        </resprocessing>
      </item>
      `;
    });
  
    qtiXML += `
    </section>
  </assessment>
  </questestinterop>`;
  
    return qtiXML;
  }
  
  // Sample JSON data
  const sampleJson = [
    {
        "q": "I ________ to the cinema tonight. I already have the tickets!",
        "answers": [
            "will go",
            "am going",
            "go",
            "will going"
        ],
        "correct_answer": 1
    },
    {
        "q": "I think it ________ rain tomorrow. The forecast said so.",
        "answers": [
            "is going to",
            "goes to",
            "will",
            "is going"
        ],
        "correct_answer": 2
    },
  ];
  
  // Convert JSON to QTI
  const qtiOutput = convertJsonToQTI(sampleJson, "FEB 6 QUIZ");
  
  // Output the QTI XML (you can download this as a file or use it as needed)
  console.log(qtiOutput);
  
  document.addEventListener('DOMContentLoaded', function() {
      const executeButton = document.getElementById('myButton');
  
  
    
      executeButton.addEventListener('click', function() {
        
        quiz_name = document.getElementById('quiz_name').value;
        if (quiz_name === '') {
            alert("Please specify the quiz name");
            return;
        }
        const js_text = getTextareaAsJSON();
        const qtiOutput = convertJsonToQTI(js_text, quiz_name);
  
        saveTextAsZippedXml(qtiOutput, "quiz.zip");
      });
    });