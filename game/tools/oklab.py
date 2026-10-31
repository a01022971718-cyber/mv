import numpy as np
def srgb_to_lin(c): c = c / 255.0; return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def lin_to_srgb(c): c = np.clip(c, 0, 1); return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055) * 255
def rgb_to_oklab(rgb):
    l = srgb_to_lin(np.asarray(rgb, float)); r, g, b = l[..., 0], l[..., 1], l[..., 2]
    L = .4122214708 * r + .5363325363 * g + .0514459929 * b; M = .2119034982 * r + .6806995451 * g + .1073969566 * b; S = .0883024619 * r + .2817188376 * g + .6299787005 * b
    L, M, S = np.cbrt(L), np.cbrt(M), np.cbrt(S)
    return np.stack([.2104542553 * L + .7936177850 * M - .0040720468 * S, 1.9779984951 * L - 2.4285922050 * M + .4505937099 * S, .0259040371 * L + .7827717662 * M - .8086757660 * S], -1)
def oklab_to_rgb(lab, clip=True):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    l = (L + .3963377774 * a + .2158037573 * b) ** 3; m = (L - .1055613458 * a - .0638541728 * b) ** 3; s = (L - .0894841775 * a - 1.2914855480 * b) ** 3
    lin = np.stack([4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.7076147010 * s], -1)
    return lin_to_srgb(lin) if clip else lin
def lch(lab): return np.stack([lab[..., 0], np.hypot(lab[..., 1], lab[..., 2]), np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360], -1)
def from_lch(L, C, h): return np.stack([L, C * np.cos(np.radians(h)), C * np.sin(np.radians(h))], -1)
def in_gamut(L, C, h):
    lin = oklab_to_rgb(from_lch(np.array(L), np.array(C), np.array(h)), clip=False); return np.all((lin >= -1e-4) & (lin <= 1 + 1e-4), -1)
def gamut_clip(L, C, h):
    lo, hi = 0.0, C
    if in_gamut(L, C, h): return C
    for _ in range(30):
        mid = (lo + hi) / 2
        if in_gamut(L, mid, h): lo = mid
        else: hi = mid
    return lo
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
rgbhex = lambda c: '#%02x%02x%02x' % tuple(int(round(v)) for v in np.clip(c, 0, 255))
