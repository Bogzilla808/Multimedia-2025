// Use library.json in assets to generate a popup with all the albums
// library.json is a list of album objects

const albumContainer = document.getElementById("albumContainer");
const albumContainer2 = document.getElementById("albumContainer2");

window.onload = async function() {
    try {
        const response = await fetch('./assets/data/library.json');
        const albums = await response.json();
        albumContainer2.innerHTML = "";

        const modalTitle = document.getElementById('exampleModalLabel');
        const modalBody = document.querySelector('#exampleModal .modal-body');
        const modal = new bootstrap.Modal(document.getElementById('exampleModal'));

        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = "col-lg-4 col-md-6 col-sm-9 col-12 album-card";

            card.dataset.title = album.album.toLowerCase();
            card.dataset.artist = album.artist.toLowerCase();

            card.innerHTML = `
            <div class="card">
                <img src="./assets/img/${album.thumbnail}" class="card-img-top" alt="${album.album}">
                <div class="card-body">
                    <h5 class="card-title">${album.album}</h5>
                    <p class="card-text">${album.artist}</p>
                    <button class="btn btn-primary view-tracks-btn" id="${album.id}">
                        View Tracks
                    </button>
                </div>
            </div>
            `;

            albumContainer2.appendChild(card);
        });

        // ==== FILTER FUNCTIONALITY ====
        const searchInput = document.getElementById("searchInput");
        searchInput.addEventListener("input", function() {
            const query = this.value.toLowerCase().trim();
            const cards = albumContainer2.querySelectorAll(".album-card");

            cards.forEach(card => {
                const title = card.getAttribute("data-title");
                const artist = card.getAttribute("data-artist");

                if(title.includes(query) || artist.includes(query)) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });

        albumContainer2.addEventListener("click", async (e) => {
            if (e.target.classList.contains("view-tracks-btn")) {
                const albumId = Number(e.target.id);
                const album = albums.find(a => a.id === albumId);

                const trackDurations = album.tracklist.map(track => {
                    const [min, sec] = track.trackLength.split(':').map(Number);
                    return {
                        ...track,
                        durationInSeconds: min * 60 + sec
                    };
                });

                const totalSeconds = album.tracklist.reduce((a, curr) => {
                    const [min, sec] = curr.trackLength.split(':').map(Number);
                    return a + (min * 60 + sec); 
                }, 0);
                const totalMinutes = Math.floor(totalSeconds / 60);
                const remainingSeconds = totalSeconds % 60;

                const avgSeconds = Math.floor(totalSeconds / album.tracklist.length);
                const avgMinutes = Math.floor(avgSeconds / 60);
                const avgRemainingSeconds = avgSeconds % 60;

                const longestTrack = trackDurations.reduce(
                    (max, t) => t.durationInSeconds > max.durationInSeconds ? t : max
                );

                const shortestTrack = trackDurations.reduce(
                    (min, t) => t.durationInSeconds < min.durationInSeconds ? t : min
                );

                if (!albumContainer2) {
                    albumContainer.innerHTML = "<p class='text-danger text-center'>Album not found.</p>";
                    return;
                }

                albumContainer.innerHTML = "<p class='text-center text-muted'>Loading tracks...</p>";
                
                modalTitle.textContent = `${album.artist} - ${album.album}`;
                modalBody.innerHTML = `
                    <div class="text-center mb-3">
                        <img src="./assets/img/${album.thumbnail}" class="img-fluid"  style="max-height: 200px; border-radius: 10px;">
                    </div>

                    <div class="text-center mb-3 trackDetails">
                        <h6>Nr. of tracks: ${album.tracklist.length}</h6>
                        <h6>Total duration: ${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}</h6>
                        <h6>Average track length: ${avgMinutes}:${avgRemainingSeconds.toString().padStart(2, '0')}</h6>
                        <h6>Longest track: ${longestTrack.title} - ${longestTrack.trackLength}</h6>
                        <h6>Shortest track: ${shortestTrack.title} - ${shortestTrack.trackLength}</h6>
                    </div>

                    <h6>Tracklist:</h6>
                     <ul class="list-group list-group-flush">
                    ${album.tracklist.map((track, i) => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${i + 1}. <a href="${track.url}">${track.title}</a></span>
                        <span class="badge bg-secondary">${track.trackLength}</span>
                    </li>
                    `).join('')}
                    </ul>
                    <a href="${album.tracklist[0].url}" target="_blank" class="btn btn-info mb-3">
                         Play First Track
                    </a>
                `;

                modal.show();
            }
        });
    } catch (err) {
        albumContainer2.innerHTML = "<p class='text-danger text-center'>Failed to load albums.</p>";
        console.log(err);
    }
}
