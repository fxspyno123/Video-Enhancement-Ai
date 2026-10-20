from typing import Tuple, Dict, Any

class ResizeService:
    """
    Implements Smart Resize without losing content:
    - Fit & Preserve (100% visible, never crop or stretch, pad remaining canvas)
    - Blur Background (blurred enlarged background + centered original foreground)
    - Solid Background (custom color padding)
    - Smart Reframe (subject-centered framing)
    """
    ASPECT_RATIOS = {
        "1:1": (1080, 1080),
        "9:16": (1080, 1920),
        "16:9": (1920, 1080),
        "4:5": (1080, 1350),
    }

    def build_resize_filtergraph(self, mode: str, target_aspect: str, custom_size: Tuple[int, int] = (1920, 1080), blur_radius: int = 20, solid_color: str = "black") -> Tuple[str, bool]:
        """
        Returns (filter_string, is_complex)
        """
        target_w, target_h = self.ASPECT_RATIOS.get(target_aspect, custom_size)

        if mode == "blur-background":
            # Enlarged blurred background with crisp original foreground centered
            # Split stream into two: bg and fg
            blur_rad = max(5, min(40, blur_radius))
            complex_str = (
                f"[0:v]split[fg_in][bg_in];"
                f"[bg_in]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},boxblur={blur_rad}:5,eq=saturation=1.1[bg];"
                f"[fg_in]scale='min({target_w},iw*{target_h}/ih)':'min({target_h},ih*{target_w}/iw)'[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2"
            )
            return complex_str, True
        elif mode == "solid-background":
            color = solid_color.replace("#", "0x")
            filter_str = f"scale='min({target_w},iw*{target_h}/ih)':'min({target_h},ih*{target_w}/iw)',pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color={color}"
            return filter_str, False
        elif mode == "smart-reframe":
            # Crop to fill
            filter_str = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
            return filter_str, False
        else: # fit-preserve default
            filter_str = f"scale='min({target_w},iw*{target_h}/ih)':'min({target_h},ih*{target_w}/iw)',pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color=black"
            return filter_str, False
