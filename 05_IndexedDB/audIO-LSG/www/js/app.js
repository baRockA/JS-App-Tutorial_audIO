//verschiedene Elemente des DOM in Konstanten speichern für schnelleres Arbeiten
const record = document.querySelector('#record');
const stop = document.querySelector('#stop');
const soundClips = document.querySelector('#sound-clips');
const soundButtons = document.querySelector('#sound-buttons');
const nameField = document.querySelector('#name');
var clipCount = 0;

//Variable über die unsere Datenbank erreicht werden kann (Objekt)
var db;
//Verfügbarkeit von IndexedDB in Browser prüfen
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    alert("IndexedDB wird nicht unterstützt!");
} else {
    var request = indexedDB.open("audiodb", 1);

    //Eventhandler für DB-Zugriffe
    request.onerror = function(event) {
        //Bei Fehlern, den Fehlercode ausgeben
        alert("Datenbankfehler: " + event.target.errorCode);
    };

    request.onsuccess = function(event) {
        //DB erzeugt
        db = request.result;

        //Mit addAudioElement die bestehenden Soundclips aus DB einfügen
        let objStore = db.transaction('soundclip').objectStore('soundclip');
        var countRequest = objStore.count();
        countRequest.onsuccess = function() {
            clipCount = countRequest.result;
        };

        objStore.openCursor().onsuccess = function(event) {
            let cursor = event.target.result;
            if (cursor) {
                addAudioElement(cursor.key, cursor.value.name, cursor.value.data);
                cursor.continue();
            }
        };
    };

    request.onupgradeneeded = function(event) {
        //Wenn DB noch nicht vorhanden
        db = request.result;
        //Wenn noch keine Soundclip-Objekte gespeichert werden können
        if (!db.objectStoreNames.contains('soundclip')) {
            //Erzeuge einen Objektspeicher für Soundclips
            db.createObjectStore('soundclip', { keyPath: 'clipid' });
        }
    };

    //Zugriff auf MediaRecorder für Audio-Aufnahme
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        //getUserMedia wird unterstützt   
        navigator.mediaDevices.getUserMedia(
            //Zugriff auf Audio wird benötigt in der App
            {
                audio: true
            }
        ).then(function(stream) {
            //Aufnahme etc.
            const mediaRecorder = new MediaRecorder(stream);

            //Eventhandler um Aufnahme zu starten
            record.onclick = function() {
                mediaRecorder.start();
                record.classList.add('act');
            }

            //Eventhandler um Aufnahme zu stoppen
            stop.onclick = function() {
                mediaRecorder.stop();
                record.classList.remove('act');
            }

            //Array zum Speichern der einzelnen Audiosequenzen
            let chunks = [];

            //Aufnehmen
            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            }

            //Beenden der Aufnahme und abspeichern des Audio-Element
            mediaRecorder.onstop = function(e) {
                const clipName = nameField.value;
                const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                clipCount++;
                chunks = [];

                //Soundclip zu DB hinzufügen
                let trans = db.transaction('soundclip', 'readwrite');
                let r = trans.objectStore('soundclip').add({ clipid: clipCount, name: clipName, data: blob });
                r.onsuccess = function() {
                    console.log("soundclip hinzugefügt");
                }

                r.onerror = function() {
                    console.log("fehler beim hinzufügen eines soundclips", r.error);
                }

                addAudioElement(clipCount, clipName, blob);
            }

        }).catch(function(err) {
            //Aufnahme nicht möglich bzw. es tritt ein Fehler auf.
            console.log('Folgender Fehler ist bei Verwendung des MediaRecorders aufgetreten: ' + err);

        });
    } else {
        alert("getUserMedia wird vom Browser nicht unterstützt!");
    }
}

function addAudioElement(clipid, clipName, blob) {
    const clipContainer = document.createElement('li');
    const clipLabel = document.createElement('label');
    const audio = document.createElement('audio');
    const deleteButton = document.createElement('a');
    const soundButton = document.createElement('button');

    soundButton.innerHTML = clipid;
    soundButton.id = "btn-clip-" + clipid;

    soundButton.onclick = function() {
        let clip = document.querySelector('#clip-' + clipid + ' audio');
        clip.play();
    }

    clipContainer.classList.add('clip');
    clipContainer.id = "clip-" + clipid;
    deleteButton.setAttribute('class', "ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all");

    deleteButton.onclick = function(e) {
        let evtTarget = e.target;

        //soundclip aus DB entfernen
        let trans = db.transaction('soundclip', 'readwrite');
        trans.objectStore('soundclip').delete(evtTarget.parentNode.id);

        soundButtons.removeChild(soundButton);
        evtTarget.parentNode.parentNode.removeChild(evtTarget.parentNode);
    }

    audio.setAttribute('controls', '');
    //Audio-Source erzeugen und einbinden
    const audioURL = URL.createObjectURL(blob);
    audio.src = audioURL;

    clipLabel.innerHTML = clipid + ": " + clipName;

    clipContainer.appendChild(audio);
    clipContainer.appendChild(clipLabel);
    clipContainer.appendChild(deleteButton);
    soundClips.appendChild(clipContainer);
    soundButtons.appendChild(soundButton);
}