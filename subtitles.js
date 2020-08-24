const fs = require('fs');
const { exec } = require('child_process');

function formatDurationPart(num) {
    if (parseInt(num) < 10) return `0${num}`;
    return `${num}`;
}

function formatDuration(totalSeconds) {
    const hours = parseInt(totalSeconds / 3600);
    const minutes = parseInt((totalSeconds / 60) % 60);
    const seconds = (parseFloat(totalSeconds % 60).toFixed(3)).toString().replace('.', ',');

    return `${formatDurationPart(hours)}:${formatDurationPart(minutes)}:${formatDurationPart(seconds)}`;

}

function formatAssDuration(totalSeconds) {
    const hours = parseInt(totalSeconds / 3600);
    const minutes = parseInt((totalSeconds / 60) % 60);
    const seconds = (parseFloat(totalSeconds % 60).toFixed(2)).toString();

    return `${hours}:${formatDurationPart(minutes)}:${formatDurationPart(seconds)}`;
}

function generateSubtitles(slides, subtitlePath, multiplyFactor = 1) {
    return new Promise((resolve) => {
        const slidesSlice = slides.slice();
        const subList = [];
        slidesSlice.forEach((slide, index) => {
            let start = formatDuration(slide.startTime * multiplyFactor);
            let end = formatDuration((slide.endTime * multiplyFactor));

            let assStart = formatAssDuration(slide.startTime * multiplyFactor);
            let assEnd = formatAssDuration((slide.endTime * multiplyFactor));

            let slideText = slide.text;
            /* eslint-disable no-useless-escape*/
            subList.push({
                index,
                commonsText: `${index + 1}\n${start} --> ${end}\n${slideText}`,
                assText: `Dialogue: 0,${assStart},${assEnd},Default,,0,0,10,${slideText}`,
                vlcText: `${index + 1}\n${start} --> ${end}\n<font size="20">${slideText}</font>`,
                vttText: `${index + 1}\n${start.replace(/\,/g, '.')} --> ${end.replace(/\,/g, '.')}\n<font>${slideText}</font>`,
            });

        })

        const commonsSubtitles = subList.map(sub => sub.commonsText);
        // const vlcSubtitles = subList.map(sub => sub.vlcText.replace(/\[([0-9]+)\]/g, `<font size="16"><b>[$1]</b></font>`));
        const asssubtitles = subList.map(s => s.assText);
        const vttSubtitles = subList.map(sub => sub.vttText.replace(/\[([0-9]+)\]/g, `<font><b>[$1]</b></font>`))
        const subtitleExtension = subtitlePath.split('.').pop();
        switch(subtitleExtension) {
            case 'vtt':
                fs.writeFileSync(subtitlePath, `WEBVTT\n\n${vttSubtitles.join('\n\n')}`);
                break;
            case 'ass':
                fs.writeFileSync(subtitlePath, `
[Script Info]
; Script generated by Videowiki
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&H00FFFFFF,&H00FFFFFF,&H5A000000,&H5A000000,0,0,0,0,100,100,0,0,4,0,5,2,0,0,0,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Text
${asssubtitles.join('\n')}                
                `);
                break;
            default:
                fs.writeFileSync(subtitlePath, commonsSubtitles.join('\n\n'));
                break;
        }

        return resolve(subtitlePath);
    })
}

function srtToAss(srtPath, assPath) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${srtPath} ${assPath}`, (err) => {
            if (err) return reject(err)
            return resolve(assPath);
        })
    })
}

module.exports = {
    generateSubtitles,
    srtToAss,
}

// generateSubtitle('Retinal detachment should be considered if there were preceding flashes or floaters, or if there is a new visual field defect in one eye.[3][4] If treated early enough, retinal tear and detachment can have a good outcome.[3]', 'https://dnv8xrxt73v5u.cloudfront.net/549754ec-5e55-472f-8715-47120efc4567.mp3', (err, filepath) => {
//   console.log(err, filepath)
// })