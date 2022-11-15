var PlaybackManager = function () {
    var self = this;
    this.isPlaying = false;
    this.stopToken = 0;
    this.currentMelodyId = 0;

    this.play = function (melodyId) {
        var svg = $("#melody-" + melodyId + " svg");
        if (self.currentMelodyId) {
            $("#btnPlay-" + self.currentMelodyId).show();
            $("#btnStop-" + self.currentMelodyId).hide();
        }
        self.currentMelodyId = melodyId;
        $("#btnPlay-" + melodyId).hide();
        $("#btnStop-" + melodyId).show();

        self.isPlaying = true;
        self.stopToken++;
        var currentStopToken = self.stopToken;
        var overalTime = 0;

        function colorBlack(elements) {
            for (var i in elements) {
                var e = elements[i];
                if (e.tagName === "line" || e.tagName === "path") e.style.stroke = "currentColor";
                else e.style.fill = "currentColor";
            }
        }
        function colorRed(elements) {
            for (var i in elements) {
                var e = elements[i];
                //console.log(e.tagName);
                if (e.tagName === "line" || e.tagName === "path") e.style.stroke = "#ff0000";
                else e.style.fill = "#ff0000";
            }
        }

        function getNoteForIdAndRepetition(noteCollection, id, repetition) {
            if (noteCollection == null) return null;
            for (var n in noteCollection) {
                if (noteCollection[n].id === id && noteCollection[n].repetition === repetition) return noteCollection[n];
            }
            return null;
        }

        var notes = [];

        svg.children().each(function (i, e) {
            var unparsedPlaybackStartAttribute = $(e).attr("data-playback-start");
            if (unparsedPlaybackStartAttribute == null) return;

            var delayTimes = unparsedPlaybackStartAttribute.split(" ");
            if (delayTimes == null) return;

            var pitchUnparsed = $(e).attr("data-midi-pitch");
            var pitch = pitchUnparsed ? parseInt(pitchUnparsed) : null;
            var durationUnparsed = $(e).attr("data-playback-duration");
            if (durationUnparsed == null) return;
            var duration = parseInt(durationUnparsed);
            var elementId = $(e).attr("id");

            for (var repetitionNumber in delayTimes) {
                var delayTime = parseInt(delayTimes[repetitionNumber]);

                var existingNoteInfo = getNoteForIdAndRepetition(notes, elementId, repetitionNumber);
                if (existingNoteInfo != null) {
                    existingNoteInfo.elements.push(e);
                }
                else {
                    var note = { delayTime: delayTime, pitch: pitch, duration: duration, elements: [], id: elementId, repetition: repetitionNumber };
                    note.elements.push(e);
                    notes.push(note);
                    var time = delayTime + duration;
                    if (time > overalTime) overalTime = time;
                }
            }
        });

        console.info('Zatrzymanie po ' + overalTime + ' ms.');

        for (var i in notes) {
            var noteInfo = notes[i];

            setTimeout(function (note) {
                return function () {
                    if (self.stopToken !== currentStopToken) {
                        colorBlack(note.elements);
                        return;
                    }

                    if (note.pitch != null) {
                        //console.info('Playing repetition ' + note.pitch + ' with ' + note.elements.length + ' elements.');
                        MIDI.noteOn(0, note.pitch, 127, 0);
                        MIDI.noteOff(0, note.pitch, note.duration * 0.001);
                    }
                    colorRed(note.elements);
                };
            }(noteInfo), noteInfo.delayTime);

            setTimeout(function (note) {
                return function () {
                    colorBlack(note.elements);
                };
            }(noteInfo), noteInfo.delayTime + noteInfo.duration);
        }

        setTimeout(function () {
            if (self.stopToken !== currentStopToken) return;
            self.stop();
        }, overalTime);
    }

    this.stop = function () {
        $("#btnPlay-" + self.currentMelodyId).show();
        $("#btnStop-" + self.currentMelodyId).hide();
        self.stopToken++;
        self.isPlaying = false;
    }
}
window.player = new PlaybackManager();