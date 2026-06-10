// Controls which top-level view is active
export type View = 'select' | 'train' | 'settings';

export const viewState: { current: View } = $state({ current: 'select' });
