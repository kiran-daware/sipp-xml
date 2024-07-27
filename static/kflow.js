const fileList = document.getElementById('fileList');
// Dynamically create list items for each XML file
xmlFiles.forEach(file => {
    const listItem = document.createElement('li');

    // Download link
    const downloadLink = document.createElement('a');
    downloadLink.href = `xml/${file}`;
    downloadLink.download = file; 
    downloadLink.textContent = `${file} - `;

    // View Diagram link
    const viewLink = document.createElement('a');
    viewLink.href = `#`;
    viewLink.textContent = `view flow`;
    viewLink.className = 'view-link';
    viewLink.setAttribute('data-filename', file);

    // Append links to the list item
    listItem.appendChild(downloadLink);
    listItem.appendChild(viewLink);
    fileList.appendChild(listItem);
});

// Event listener for View Diagram links
document.addEventListener('click', async (event) => {
    if (event.target && event.target.classList.contains('view-link')) {
        event.preventDefault();
        const fileName = event.target.getAttribute('data-filename');
        try {
            const xmlText = await fetchXMLFile(fileName);
            const xmlDoc = parseXML(xmlText);
            const umlText = generateUMLText(xmlDoc, fileName);
            console.log(umlText)
            renderDiagram(umlText);
        } catch (error) {
            console.error("Error:", error);
        }
    }
});

async function fetchXMLFile(fileName) {
    const response = await fetch(`https://kiran-daware.github.io/sipp-xml/xml/${fileName}`);
    if (!response.ok) {
        throw new Error(`Could not fetch ${fileName}`);
    }
    const xmlText = await response.text();
    return xmlText;
}

function parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    return xmlDoc;
}


function extractMessageType(message) {
    // Match SIP request methods
    const requestMatch = message.match(/^\s*(INVITE|ACK|BYE|CANCEL|OPTIONS|REGISTER|PRACK|SUBSCRIBE|NOTIFY|PUBLISH|INFO|REFER|MESSAGE|UPDATE)\s+/m);
    // Match SIP response codes
    const responseMatch = message.match(/^\s*SIP\/\d\.\d\s*(\d{3})\s+/m);

    if (requestMatch) {
        return requestMatch[1];
    } else if (responseMatch) {
        return `${responseMatch[1]}`;
    } else {
        return 'Unknown';
    }
}


function generateUMLText(xmlDoc, fileName) {
    let umlText = `
participant ${fileName} as thisXml
participant farEnd
`;
    const allElements = xmlDoc.getElementsByTagName("*"); // Get all elements
    const sipMessages = [];

    // Iterate over all elements and filter `send` and `recv`
    Array.from(allElements).forEach(element => {
        if (element.tagName === "send" || element.tagName === "recv") {
            sipMessages.push(element);
        }
    });

    console.log(sipMessages);


    sipMessages.forEach(messageElement => {
        const tagName = messageElement.tagName;
        const from = tagName === "send" ? "thisXml" : "farEnd";
        const to = tagName === "send" ? "farEnd" : "thisXml";

        if (tagName === "send") {
            const message = messageElement.textContent.trim();
            const messageType = extractMessageType(message);
            umlText += `${from} -> ${to}: send    ${messageType}\n`;
        } else if (tagName === "recv") {
            const request = messageElement.getAttribute("request");
            const response = messageElement.getAttribute("response");
            let statusCodeAndText = '';

            if (request) {
                statusCodeAndText = request;
            } else if (response) {
                statusCodeAndText = response;
            }

            umlText += `${from} -> ${to}: recv    ${statusCodeAndText}\n`;
        }
    });
    return umlText;
}

function renderDiagram(umlText) {
    const container = document.getElementById('diagram');
    // Clear the old diagram
    container.innerHTML = '';
    const diagram = Diagram.parse(umlText);
    diagram.drawSVG('diagram', {theme: 'simple'});
}