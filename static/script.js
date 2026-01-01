console.log("Hello!")

const doc_types = {
  "record":"Record", 
  "presc":"Prescription", 
  "fundus":"Fundus Photo", 
  "DFA":"DFA", 
  "fieldTest":"Field Test", 
  "OCT":"OCT", 
  "biometry":"Biometry", 
  "photo":"Clinical Photo"
};

updateDocumentTypes(document.getElementById("document_type"));


function updateDocumentTypes(dropdown){
  Object.keys(doc_types).forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = doc_types[item];
      dropdown.appendChild(option);
    });
}

function clickUpload(uploadMode){
    const fileInput = document.getElementById('file');
    if (uploadMode == 'capture'){
            fileInput.setAttribute('capture', 'environment'); // hint camera
            fileInput.click();
    }
    else {
        fileInput.removeAttribute('capture');
        fileInput.removeAttribute('accept'); //hint regular file upload
        fileInput.click();
    }
}

function showPatientFiles(){
    const patient_id = document.getElementById("patient_id_lookup").value
    console.log(patient_id)
    fetch(`/getrecords?patient_id=${patient_id}`)
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // or response.text() for plain text
        })
        .then(records => {
            // console.log(records); // handle the data from the GET request
            renderFileTree(patient_id, records);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
    });
}

function renderFileTree(patient_id, records, containerId = "records_div") {
    // console.log('Rendering Records')
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear existing content
  container.innerHTML = "";

  const frag = document.createDocumentFragment();

  // Sort folders alphabetically (optional)
  const folders = Object.keys(records);//.sort((a, b) => a.localeCompare(b));
  if (folders.length == 0) {
    alert("No records exist!")
  }

  folders.forEach(folderName => {
    const files = Array.isArray(records[folderName]) ? records[folderName] : [];

    // Wrapper for each folder
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";

    // Folder title
    const title = document.createElement("h3");
    title.className = "folder-title";
    title.textContent = folderName;
    folderDiv.appendChild(title);

    // File list
    const list = document.createElement("ul");
    list.className = "file-list";

    if (files.length === 0) {
      const filediv = document.createElement("div");
      filediv.className = "file empty";
      filediv.textContent = "(empty)";
      list.appendChild(filediv);
    } else {
      // Sort files alphabetically (optional)
        files.slice().sort((a, b) => a.localeCompare(b)).forEach(file => {
        const filediv = document.createElement("div");
        filediv.className = "filediv";

        const thumbnail = document.createElement("img");
        if (['jpg','png','jpeg'].includes(file.split('.')[1])){
          thumbnail.src = `/getfile?directory=uploads/${patient_id}/${folderName}&filename=${file}`; 
        }
        else{
          thumbnail.src = `/getfile?directory=static&filename=document_icon.png`; 
        }
        thumbnail.width = 150;

        const link = document.createElement("a");
        link.href = `/getfile?directory=uploads/${patient_id}/${folderName}&filename=${file}`; 
        link.textContent = file;
        link.target = "_blank"; // opens in new tab
        link.className = "genlink";

        const deletelink = document.createElement("a");
        deletelink.href = `javascript:deleteFile("${patient_id}","${folderName}","${file}")`; // adjust base path as needed
        deletelink.textContent = "Delete";
        deletelink.className = "deletelink"

        const renamer = document.createElement("select");
        updateDocumentTypes(renamer);
        renamer.value = file.split('.')[0].split('_')[2];
        renamer.addEventListener("change", (event) => renameFile(event, patient_id, folderName, file));

        filediv.appendChild(thumbnail);
        filediv.appendChild(link);
        filediv.appendChild(renamer);
        filediv.appendChild(deletelink);
        list.appendChild(filediv);
        });
    }

    folderDiv.appendChild(list);
    frag.appendChild(folderDiv);
  });

  container.appendChild(frag);
}

function deleteFile(patient_id, folderName, file){
  if (confirm(`Delete ${file}?`)) {
      fetch(`/deletefile?directory=uploads/${patient_id}/${folderName}&filename=${file}`)
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // or response.text() for plain text
        })
        .then(data => {
            showPatientFiles();
        })
        .catch(error => {
            console.error('Error deleting files:', error);
    });
  } 
  else {
      console.log("User clicked Cancel or pressed ESC");
  }
}

function renameFile(event, patient_id, folderName, file){
  // console.log('Renamer function');
  document_type = event.target.value
    if (confirm(`Reassign to ${doc_types[document_type]}?`)) {
      // console.log(patient_id, folderName, file, document_type);
      fetch(`/renamefile?directory=uploads/${patient_id}/${folderName}&filename=${file}&document_type=${document_type}`)
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // or response.text() for plain text
        })
        .then(data => {
            showPatientFiles();
        })
        .catch(error => {
            console.error('Error deleting files:', error);
    });
  } 
  else {
      console.log("User clicked Cancel or pressed ESC");
  }
}

  function handleChange(event) {
      ;
      console.log("You picked:", selectedValue);
      alert("You picked: " + selectedValue);
    }