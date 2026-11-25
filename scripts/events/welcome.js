const { getTime } = global.utils;
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

async function loadRemoteImage(url) {
    try {
        if (!url) return null;

        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        return await loadImage(
            Buffer.from(response.data)
        );
    } catch (error) {
        return null;
    }
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(
        x + w,
        y,
        x + w,
        y + r
    );
    ctx.lineTo(
        x + w,
        y + h - r
    );
    ctx.quadraticCurveTo(
        x + w,
        y + h,
        x + w - r,
        y + h
    );
    ctx.lineTo(
        x + r,
        y + h
    );
    ctx.quadraticCurveTo(
        x,
        y + h,
        x,
        y + h - r
    );
    ctx.lineTo(
        x,
        y + r
    );
    ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );
    ctx.closePath();
}

function drawAnimeBackground(ctx, width, height) {
    const sky = ctx.createLinearGradient(
        0,
        0,
        0,
        height
    );

    sky.addColorStop(0, "#070b25");
    sky.addColorStop(0.35, "#11194a");
    sky.addColorStop(0.62, "#35205a");
    sky.addColorStop(0.82, "#10152f");
    sky.addColorStop(1, "#030510");

    ctx.fillStyle = sky;
    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    const moonGlow =
        ctx.createRadialGradient(
            width * 0.77,
            height * 0.22,
            10,
            width * 0.77,
            height * 0.22,
            430
        );

    moonGlow.addColorStop(
        0,
        "rgba(180,220,255,0.34)"
    );

    moonGlow.addColorStop(
        0.35,
        "rgba(100,150,255,0.13)"
    );

    moonGlow.addColorStop(
        1,
        "rgba(80,100,255,0)"
    );

    ctx.fillStyle = moonGlow;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    ctx.save();

    ctx.shadowColor = "#d9edff";
    ctx.shadowBlur = 35;

    ctx.fillStyle = "#edf6ff";

    ctx.beginPath();

    ctx.arc(
        width * 0.77,
        height * 0.22,
        82,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    const cloudGradient =
        ctx.createLinearGradient(
            0,
            height * 0.3,
            0,
            height * 0.58
        );

    cloudGradient.addColorStop(
        0,
        "rgba(110,125,210,0.06)"
    );

    cloudGradient.addColorStop(
        1,
        "rgba(20,20,70,0)"
    );

    ctx.fillStyle =
        cloudGradient;

    for (let i = 0; i < 12; i++) {
        const x =
            (i / 12) * width - 150;

        const y =
            height * 0.38 +
            Math.sin(i * 1.8) * 45;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            260,
            55,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    drawAnimeMountains(
        ctx,
        width,
        height
    );

    drawAnimeCity(
        ctx,
        width,
        height
    );

    drawAnimeTrees(
        ctx,
        width,
        height
    );

    drawAnimeParticles(
        ctx,
        width,
        height
    );

    const darkOverlay =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    darkOverlay.addColorStop(
        0,
        "rgba(2,4,20,0.05)"
    );

    darkOverlay.addColorStop(
        0.55,
        "rgba(3,4,20,0.08)"
    );

    darkOverlay.addColorStop(
        1,
        "rgba(0,0,10,0.58)"
    );

    ctx.fillStyle =
        darkOverlay;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}

function drawAnimeMountains(
    ctx,
    width,
    height
) {
    ctx.save();

    ctx.fillStyle =
        "rgba(8,12,42,0.92)";

    ctx.beginPath();

    ctx.moveTo(
        0,
        height * 0.67
    );

    ctx.lineTo(
        width * 0.18,
        height * 0.48
    );

    ctx.lineTo(
        width * 0.34,
        height * 0.65
    );

    ctx.lineTo(
        width * 0.52,
        height * 0.43
    );

    ctx.lineTo(
        width * 0.72,
        height * 0.64
    );

    ctx.lineTo(
        width * 0.88,
        height * 0.5
    );

    ctx.lineTo(
        width,
        height * 0.65
    );

    ctx.lineTo(
        width,
        height
    );

    ctx.lineTo(
        0,
        height
    );

    ctx.closePath();

    ctx.fill();

    ctx.strokeStyle =
        "rgba(104,135,255,0.18)";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        0,
        height * 0.67
    );

    ctx.lineTo(
        width * 0.18,
        height * 0.48
    );

    ctx.lineTo(
        width * 0.34,
        height * 0.65
    );

    ctx.lineTo(
        width * 0.52,
        height * 0.43
    );

    ctx.lineTo(
        width * 0.72,
        height * 0.64
    );

    ctx.lineTo(
        width * 0.88,
        height * 0.5
    );

    ctx.lineTo(
        width,
        height * 0.65
    );

    ctx.stroke();

    ctx.restore();
}

function drawAnimeCity(
    ctx,
    width,
    height
) {
    ctx.save();

    const baseY =
        height * 0.72;

    for (let i = 0; i < 34; i++) {
        const buildingWidth =
            35 + Math.random() * 65;

        const buildingHeight =
            80 + Math.random() * 190;

        const x =
            i * 63 +
            Math.random() * 20;

        const y =
            baseY -
            buildingHeight;

        ctx.fillStyle =
            i % 2 === 0
                ? "rgba(7,11,34,0.95)"
                : "rgba(12,15,43,0.96)";

        ctx.fillRect(
            x,
            y,
            buildingWidth,
            buildingHeight
        );

        for (
            let wy = y + 25;
            wy < baseY - 15;
            wy += 28
        ) {
            if (
                Math.random() > 0.35
            ) {
                ctx.fillStyle =
                    Math.random() > 0.5
                        ? "rgba(80,220,255,0.75)"
                        : "rgba(182,102,255,0.65)";

                ctx.fillRect(
                    x + 10,
                    wy,
                    8,
                    12
                );
            }
        }
    }

    ctx.fillStyle =
        "rgba(4,7,20,0.98)";

    ctx.fillRect(
        0,
        baseY,
        width,
        height - baseY
    );

    ctx.restore();
}

function drawAnimeTrees(
    ctx,
    width,
    height
) {
    ctx.save();

    const treePositions = [
        [110, 730],
        [280, 700],
        [1680, 710],
        [1880, 735]
    ];

    for (
        const [x, y]
        of treePositions
    ) {
        ctx.fillStyle =
            "#070a20";

        ctx.fillRect(
            x - 10,
            y - 180,
            20,
            180
        );

        for (
            let i = 0;
            i < 18;
            i++
        ) {
            const px =
                x +
                (Math.random() - 0.5) *
                    170;

            const py =
                y -
                130 -
                Math.random() * 150;

            const size =
                25 +
                Math.random() * 45;

            const glow =
                ctx.createRadialGradient(
                    px,
                    py,
                    2,
                    px,
                    py,
                    size
                );

            glow.addColorStop(
                0,
                "rgba(255,120,215,0.65)"
            );

            glow.addColorStop(
                0.45,
                "rgba(177,92,255,0.28)"
            );

            glow.addColorStop(
                1,
                "rgba(100,70,255,0)"
            );

            ctx.fillStyle =
                glow;

            ctx.beginPath();

            ctx.arc(
                px,
                py,
                size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }

    ctx.restore();
}

function drawAnimeParticles(
    ctx,
    width,
    height
) {
    ctx.save();

    for (
        let i = 0;
        i < 150;
        i++
    ) {
        const x =
            Math.random() *
            width;

        const y =
            Math.random() *
            height;

        const r =
            1 +
            Math.random() * 3;

        ctx.fillStyle =
            i % 3 === 0
                ? "rgba(255,140,225,0.8)"
                : i % 3 === 1
                    ? "rgba(93,225,255,0.7)"
                    : "rgba(190,150,255,0.65)";

        ctx.shadowColor =
            ctx.fillStyle;

        ctx.shadowBlur = 12;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            r,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}

function drawScanlines(
    ctx,
    width,
    height
) {
    ctx.save();

    ctx.globalAlpha = 0.035;

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 1;

    for (
        let y = 0;
        y < height;
        y += 8
    ) {
        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }

    ctx.restore();
}

function drawHUDCorners(
    ctx,
    width,
    height
) {
    ctx.save();

    ctx.lineWidth = 3;

    ctx.strokeStyle =
        "rgba(78,224,255,0.8)";

    const d = 85;
    const p = 55;

    ctx.beginPath();

    ctx.moveTo(
        p,
        p + d
    );

    ctx.lineTo(
        p,
        p
    );

    ctx.lineTo(
        p + d,
        p
    );

    ctx.moveTo(
        width - p - d,
        p
    );

    ctx.lineTo(
        width - p,
        p
    );

    ctx.lineTo(
        width - p,
        p + d
    );

    ctx.moveTo(
        p,
        height - p - d
    );

    ctx.lineTo(
        p,
        height - p
    );

    ctx.lineTo(
        p + d,
        height - p
    );

    ctx.moveTo(
        width - p - d,
        height - p
    );

    ctx.lineTo(
        width - p,
        height - p
    );

    ctx.lineTo(
        width - p,
        height - p - d
    );

    ctx.stroke();

    ctx.restore();
}

function drawGlassPanel(
    ctx,
    x,
    y,
    w,
    h,
    radius = 24
) {
    ctx.save();

    roundedRect(
        ctx,
        x,
        y,
        w,
        h,
        radius
    );

    const gradient =
        ctx.createLinearGradient(
            x,
            y,
            x + w,
            y + h
        );

    gradient.addColorStop(
        0,
        "rgba(8,20,50,0.72)"
    );

    gradient.addColorStop(
        0.5,
        "rgba(5,12,35,0.52)"
    );

    gradient.addColorStop(
        1,
        "rgba(20,10,55,0.65)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fill();

    ctx.strokeStyle =
        "rgba(92,220,255,0.22)";

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.restore();
}

function drawCornerDetails(
    ctx,
    x,
    y,
    w,
    h,
    color = "#58e5ff"
) {
    ctx.save();

    ctx.strokeStyle =
        color;

    ctx.lineWidth = 3;

    const size = 24;

    ctx.beginPath();

    ctx.moveTo(
        x,
        y + size
    );

    ctx.lineTo(
        x,
        y
    );

    ctx.lineTo(
        x + size,
        y
    );

    ctx.moveTo(
        x + w - size,
        y
    );

    ctx.lineTo(
        x + w,
        y
    );

    ctx.lineTo(
        x + w,
        y + size
    );

    ctx.moveTo(
        x,
        y + h - size
    );

    ctx.lineTo(
        x,
        y + h
    );

    ctx.lineTo(
        x + size,
        y + h
    );

    ctx.moveTo(
        x + w - size,
        y + h
    );

    ctx.lineTo(
        x + w,
        y + h
    );

    ctx.lineTo(
        x + w,
        y + h - size
    );

    ctx.stroke();

    ctx.restore();
}

function drawAvatarRing(
    ctx,
    x,
    y,
    radius
) {
    ctx.save();

    ctx.shadowColor =
        "#42e7ff";

    ctx.shadowBlur = 45;

    ctx.strokeStyle =
        "#55e8ff";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 18,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
        "rgba(189,116,255,0.85)";

    ctx.lineWidth = 3;

    ctx.setLineDash([
        25,
        14
    ]);

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 34,
        -0.5,
        Math.PI * 1.35
    );

    ctx.stroke();

    ctx.strokeStyle =
        "rgba(74,226,255,0.8)";

    ctx.setLineDash([
        10,
        20
    ]);

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 48,
        1.8,
        Math.PI * 1.85
    );

    ctx.stroke();

    ctx.setLineDash([]);

    ctx.restore();
}

function drawMainAvatar(
    ctx,
    image,
    x,
    y,
    size
) {
    const radius =
        size / 2;

    drawAvatarRing(
        ctx,
        x,
        y,
        radius
    );

    ctx.save();

    ctx.shadowColor =
        "#54eaff";

    ctx.shadowBlur = 70;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 10,
        0,
        Math.PI * 2
    );

    const border =
        ctx.createLinearGradient(
            x - radius,
            y - radius,
            x + radius,
            y + radius
        );

    border.addColorStop(
        0,
        "#48e9ff"
    );

    border.addColorStop(
        0.3,
        "#ffffff"
    );

    border.addColorStop(
        0.65,
        "#ad69ff"
    );

    border.addColorStop(
        1,
        "#42e6ff"
    );

    ctx.fillStyle =
        border;

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 3,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#05091d";

    ctx.fill();

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
        image,
        x - radius,
        y - radius,
        size,
        size
    );

    ctx.restore();

    ctx.strokeStyle =
        "rgba(255,255,255,0.9)";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

function drawSmallAvatar(
    ctx,
    image,
    x,
    y,
    size
) {
    const radius =
        size / 2;

    ctx.save();

    ctx.shadowColor =
        "#48dcff";

    ctx.shadowBlur = 25;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius + 7,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "#55eaff";

    ctx.lineWidth = 4;

    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
        image,
        x - radius,
        y - radius,
        size,
        size
    );

    ctx.restore();

    ctx.restore();
}

function drawGroupPanel(
    ctx,
    image,
    groupName
) {
    const x = 100;
    const y = 125;
    const w = 570;
    const h = 420;

    drawGlassPanel(
        ctx,
        x,
        y,
        w,
        h,
        32
    );

    drawCornerDetails(
        ctx,
        x,
        y,
        w,
        h
    );

    ctx.save();

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.font =
        'bold 18px "Segoe UI", Arial';

    ctx.fillStyle =
        "rgba(91,229,255,0.72)";

    ctx.fillText(
        "OUR GROUP",
        x + 45,
        y + 48
    );

    ctx.font =
        'bold 14px "Segoe UI", Arial';

    ctx.fillStyle =
        "rgba(170,190,220,0.55)";

    ctx.fillText(
        "𝐌𝐚𝐑𝐮𝐅",
        x + w - 205,
        y + 48
    );

    ctx.restore();

    const avatarX =
        x + w / 2;

    const avatarY =
        y + 175;

    if (image) {
        drawSmallAvatar(
            ctx,
            image,
            avatarX,
            avatarY,
            180
        );
    }

    ctx.save();

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    let fontSize = 34;

    while (
        fontSize > 20
    ) {
        ctx.font =
            `bold ${fontSize}px "Segoe UI", Arial`;

        if (
            ctx.measureText(
                String(groupName)
            ).width <=
            w - 80
        ) {
            break;
        }

        fontSize -= 2;
    }

    const gradient =
        ctx.createLinearGradient(
            x + 40,
            0,
            x + w - 40,
            0
        );

    gradient.addColorStop(
        0,
        "#62e4ff"
    );

    gradient.addColorStop(
        0.5,
        "#ffffff"
    );

    gradient.addColorStop(
        1,
        "#b279ff"
    );

    ctx.fillStyle =
        gradient;

    ctx.shadowColor =
        "rgba(76,226,255,0.35)";

    ctx.shadowBlur = 20;

    ctx.fillText(
        String(groupName),
        avatarX,
        y + 330
    );

    ctx.shadowBlur = 0;

    ctx.restore();

    ctx.save();

    ctx.strokeStyle =
        "rgba(82,226,255,0.22)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        x + 50,
        y + 365
    );

    ctx.lineTo(
        x + w - 50,
        y + 365
    );

    ctx.stroke();

    ctx.restore();
}

function drawAdderPanel(
    ctx,
    image,
    adderName
) {
    const x = 100;
    const y = 600;
    const w = 570;
    const h = 350;

    drawGlassPanel(
        ctx,
        x,
        y,
        w,
        h,
        32
    );

    drawCornerDetails(
        ctx,
        x,
        y,
        w,
        h,
        "#ae7cff"
    );

    ctx.save();

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.font =
        'bold 18px "Segoe UI", Arial';

    ctx.fillStyle =
        "rgba(185,137,255,0.85)";

    ctx.fillText(
        "INVITED BY",
        x + 45,
        y + 48
    );

    ctx.restore();

    const avatarX =
        x + w / 2;

    const avatarY =
        y + 145;

    if (image) {
        drawSmallAvatar(
            ctx,
            image,
            avatarX,
            avatarY,
            145
        );
    }

    ctx.save();

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    let fontSize = 31;

    while (
        fontSize > 20
    ) {
        ctx.font =
            `bold ${fontSize}px "Segoe UI", Arial`;

        if (
            ctx.measureText(
                String(adderName)
            ).width <=
            w - 70
        ) {
            break;
        }

        fontSize -= 2;
    }

    ctx.fillStyle =
        "#ffffff";

    ctx.shadowColor =
        "rgba(174,124,255,0.45)";

    ctx.shadowBlur = 20;

    ctx.fillText(
        String(adderName),
        avatarX,
        y + 275
    );

    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawHeroPanel(
    ctx,
    image,
    userName
) {
    const x = 740;
    const y = 90;
    const w = 1160;
    const h = 880;

    drawGlassPanel(
        ctx,
        x,
        y,
        w,
        h,
        42
    );

    drawCornerDetails(
        ctx,
        x,
        y,
        w,
        h
    );

    ctx.save();

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.font =
        'bold 18px "Segoe UI", Arial';

    ctx.fillStyle =
        "rgba(89,225,255,0.78)";

    ctx.fillText(
        "WEL
