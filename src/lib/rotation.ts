import { ROTATION_ALG } from '$lib/types/rotation';
import type { StickerColor } from '$lib/types/stickering';

function getRotationAlg(
	crossColor: StickerColor | StickerColor[],
	frontColor: StickerColor | StickerColor[]
) {
	const cross = Array.isArray(crossColor) ? crossColor[0] : crossColor;
	const front = Array.isArray(frontColor) ? frontColor[0] : frontColor;
	if (!cross || !front) return "z2 y'";
	return ROTATION_ALG[cross]?.[front] ?? "z2 y'";
}

export default getRotationAlg;
