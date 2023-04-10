import { getSongSrc } from "./song-loader.js";
import { getAllBookMetaData } from "./book_import";
import panzoom from "panzoom";
import { Capacitor } from "@capacitor/core";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.min";
import pdfjsWorkerURL from "pdfjs-dist/legacy/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerURL;

const panzoomContainer = document.getElementById("panzoomContainer");
panzoom(panzoomContainer, {
    beforeWheel: (e) => {
        return !e.shiftKey;
    },
    maxZoom: 3,
    minZoom: Capacitor.getPlatform() !== "web" ? 1 : 0.25,
    bounds: true,
    boundsPadding: 0.5,
});

let displayedImages = [];
// Change image dynamically if dark/light mode changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (_) => {
    for (let element of displayedImages) {
        invertSongColor(element);
    }
});

function invertSongColor(element) {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        if (window.localStorage.getItem("songInverted") == "true") {
            element.style.filter = "invert(92%)";
        } else {
            element.style.filter = "invert(0%)";
        }
    }
}

async function displaySongPDF(songSrc) {
    let pdfDoc = await pdfjsLib.getDocument(songSrc).promise;
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        // Create canvas element to render PDF onto
        let canvas = document.createElement("canvas");
        canvas.classList.add("song_img");
        invertSongColor(canvas);
        panzoomContainer.appendChild(canvas);
        displayedImages.push(canvas);

        // Grab current page
        let page = await pdfDoc.getPage(pageNum);
        let viewport = page.getViewport({ scale: 5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        let ctx = canvas.getContext("3d"); // 3D faster then 2D?
        await page.render({
            canvasContext: ctx,
            viewport: viewport,
        }).promise;
    }
}

async function displaySongImg(songSrc) {
    displayedImages = [];
    let img = document.createElement("img");
    img.classList.add("song_img");
    invertSongColor(img);
    panzoomContainer.appendChild(img);
    displayedImages.push(img);
    img.setAttribute("src", songSrc);
    img.onerror = () => {
        img.src = "assets/wifi_off.svg";
        img.style.width = "50%";
        img.style.height = "50%";
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            img.style.filter = "invert(92%)";
        }
    };
}

async function displaySong(bookName, songNum) {
    displayedImages = [];
    const searchContent = document.getElementById("content");
    searchContent.classList.add("hidden");
    const BOOK_METADATA = await getAllBookMetaData();

    const songViewTitle = document.getElementById("titlenumber");
    songViewTitle.innerHTML = `#${songNum}`;

    const songSrc = getSongSrc(bookName, songNum, BOOK_METADATA);

    const songView = document.getElementById("songview");
    songView.classList.remove("hidden");
    if (BOOK_METADATA[bookName].fileExtension != "pdf") {
        displaySongImg(songSrc);
    } else {
        displaySongPDF(songSrc);
    }
}

const urlParams = new URLSearchParams(window.location.search);
const bookName = urlParams.get("book");
const songNum = urlParams.get("song");
if (bookName != null && songNum != null) {
    displaySong(bookName, songNum);
}

export { displaySong };
