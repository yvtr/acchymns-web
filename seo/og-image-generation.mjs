// This generates open graph images for all the songs in each book, and each book.
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import juice from "juice";
import { html as toSatoriHtml } from "satori-html";
import fs from "node:fs";

// Get template for song_preview
const song_preview_template = juice(fs.readFileSync("seo/song_preview.html", "utf-8")).replace(/ class=".+?"/g, "");
const lato_regular = fs.readFileSync("seo/Lato-Regular.woff");
const lato_bold = fs.readFileSync("seo/Lato-Bold.woff");

export async function generateSongPreview(book, song_number, song_title, primary_color, secondary_color) {
    if (song_title.length == 0) {
        song_title = "Untitled";
    }
    const rendered_template = song_preview_template
        .replace("{{BOOK_NAME}}", book)
        .replace("{{SONG_NUMBER}}", song_number)
        .replace("{{SONG_TITLE}}", song_title)
        .replace("'{{PRIMARY_COLOR}}'", primary_color)
        .replace("'{{SECONDARY_COLOR}}'", secondary_color);
    const react_jsx = toSatoriHtml(rendered_template);
    const svg = await satori(react_jsx, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: "custom",
                data: lato_regular,
                weight: 400,
            },
            {
                name: "custom",
                data: lato_bold,
                weight: 700,
            },
        ],
    });

    const resvg = new Resvg(svg, {
        width: 1200,
        height: 630,
    });
    const data = resvg.render();
    const png = data.asPng();
    return png;
}
