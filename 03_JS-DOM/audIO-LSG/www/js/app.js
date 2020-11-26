//verschiedene Elemente des DOM in Konstanten speichern für schnelleres Arbeiten
const record = document.querySelector('#record');
const stop = document.querySelector('#stop');
const soundClips = document.querySelector('#sound-clips');
const soundButtons = document.querySelector('#sound-buttons');
const nameField = document.querySelector('#name');

addAudioElement(1, "blub");

function addAudioElement(clipid, clipName) {
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
        soundButtons.removeChild(soundButton);
        evtTarget.parentNode.parentNode.removeChild(evtTarget.parentNode);
    }

    audio.setAttribute('controls', '');
    clipLabel.innerHTML = clipid + ": " + clipName;

    clipContainer.appendChild(audio);
    clipContainer.appendChild(clipLabel);
    clipContainer.appendChild(deleteButton);
    soundClips.appendChild(clipContainer);
    soundButtons.appendChild(soundButton);
}