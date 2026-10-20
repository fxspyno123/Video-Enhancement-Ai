from typing import Dict, Any, List

class ColorService:
    """
    Constructs FFmpeg color grading filters for basic and advanced color corrections,
    RGB balance, vignette, and cinematic LUT simulations.
    """
    def build_color_filters(self, settings: Dict[str, Any]) -> List[str]:
        filters = []

        brightness = settings.get("brightness", 0) / 200.0  # -0.5 to 0.5
        contrast = 1.0 + (settings.get("contrast", 0) / 100.0)
        saturation = 1.0 + (settings.get("saturation", 0) / 100.0)
        gamma = 1.0 + (settings.get("gamma", 0) / 100.0)

        filters.append(f"eq=brightness={brightness:.2f}:contrast={contrast:.2f}:saturation={saturation:.2f}:gamma={gamma:.2f}")

        # RGB Balance & Temperature
        temp = settings.get("temperature", 0) / 100.0 * 0.2
        r = (settings.get("rgbRed", 0) / 200.0) + temp
        g = settings.get("rgbGreen", 0) / 200.0
        b = (settings.get("rgbBlue", 0) / 200.0) - temp

        if abs(r) > 0.01 or abs(g) > 0.01 or abs(b) > 0.01:
            filters.append(f"colorbalance=rs={r:.2f}:gs={g:.2f}:bs={b:.2f}")

        # Vignette
        vignette = settings.get("vignette", 0)
        if vignette > 0:
            rad = (vignette / 100.0) * 0.6
            filters.append(f"vignette=PI/4*{rad:.2f}")

        # LUT / Style presets
        lut = settings.get("lutPreset", "none")
        if lut == "cinematic":
            filters.append("colorbalance=rs=0.08:gs=-0.02:bs=-0.06:rm=0.04:gm=0.0:bm=-0.04,eq=contrast=1.1")
        elif lut == "warm":
            filters.append("colorbalance=rs=0.12:gs=0.02:bs=-0.1")
        elif lut == "cool":
            filters.append("colorbalance=rs=-0.08:gs=0.02:bs=0.12")
        elif lut == "film-look":
            filters.append("curves=vintage")
        elif lut == "dark-moody":
            filters.append("eq=brightness=-0.05:contrast=1.2:saturation=0.85")
        elif lut == "vibrant-anime":
            filters.append("eq=saturation=1.4:contrast=1.15:brightness=0.02")

        return filters
