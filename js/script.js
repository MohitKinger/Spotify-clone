console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let res = await fetch(`/${folder}/`);
        let response = await res.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let i = 0; i < as.length; i++) {
            const element = as[i];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Display songs in UI
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${decodeURIComponent(song.replaceAll("%20", " "))}</div>
                        <div>Mohit</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
        }

        // Add click events to play songs
        Array.from(songUL.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });

        return songs;
    } catch (err) {
        console.error("Error loading songs:", err);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("Displaying albums");
    try {
        let res = await fetch(`/songs/`);
        let response = await res.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        for (let i = 0; i < anchors.length; i++) {
            const e = anchors[i];
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let fullPath = new URL(e.href).pathname;
                let folder = decodeURIComponent(fullPath.split("/songs/")[1]?.replace("/", ""));

                if (!folder) continue;

                try {
                    let metaRes = await fetch(`/songs/${folder}/info.json`);
                    if (!metaRes.ok) throw new Error(`Missing info.json in ${folder}`);
                    let meta = await metaRes.json();

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${meta.title}</h2>
                            <p>${meta.description}</p>
                        </div>`;
                } catch (err) {
                    console.error(err.message);
                }
            }
        }

        // Handle album click
        Array.from(document.getElementsByClassName("card")).forEach(card => {
            card.addEventListener("click", async () => {
                console.log("Fetching songs for:", card.dataset.folder);
                songs = await getSongs(`songs/${card.dataset.folder}`);
                if (songs?.length) playMusic(songs[0]);
            });
        });
    } catch (err) {
        console.error("Error displaying albums:", err);
    }
}

async function main() {
    // Load default playlist
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Load albums
    await displayAlbums();

    // Play/pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous song
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next song
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume>img").src = currentSong.volume > 0
            ? "img/volume.svg"
            : "img/mute.svg";
    });

    // Mute/Unmute
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
