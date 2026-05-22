/**
 * Vue / Element Plus 风格后台：白底卡片、细边框、常规字重标题、无夸张字间距。
 * 供站点设置、首页装修等管理表单复用。
 */

export const ADM_FORM_WRAP = 'mx-auto max-w-5xl space-y-5 pb-10 px-1';

/** 单块设置卡片（白底 + 浅边框） */
export const ADM_CARD = 'rounded border border-[#ebeef5] bg-white p-5 shadow-sm';

/** 卡片内分区标题 */
export const ADM_CARD_TITLE =
  'mb-4 border-b border-[#ebeef5] pb-2 text-sm font-medium text-[#303133]';

export const ADM_SECTION_DESC = 'mb-4 text-xs leading-relaxed text-[#909399]';

export const ADM_LABEL = 'mb-1.5 block text-sm text-[#606266]';

export const ADM_LABEL_COMPACT = 'mb-1 block text-xs text-[#606266]';

export const ADM_HINT = 'mt-1 text-xs leading-relaxed text-[#909399]';

/** 表单项：白底、#dcdfe6 边框、Element 主色聚焦环 */
export const ADM_INPUT =
  'w-full rounded-sm border border-[#dcdfe6] bg-white px-3 py-2 text-sm text-[#606266] outline-none transition-[border-color,box-shadow] focus:border-[#409eff] focus:ring-1 focus:ring-[#c6e2ff]';

export const ADM_TEXTAREA = `${ADM_INPUT} min-h-[88px] resize-y align-top`;

/** 卡片内分组（浅灰底） */
export const ADM_SUBCARD = 'space-y-3 rounded-sm border border-[#ebeef5] bg-[#fafafa] p-4';

export const ADM_BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-sm border border-[#409eff] bg-[#409eff] px-5 py-2 text-sm font-medium text-white hover:bg-[#66b1ff] disabled:cursor-not-allowed disabled:opacity-50';

export const ADM_BTN_DEFAULT =
  'inline-flex items-center justify-center rounded-sm border border-[#dcdfe6] bg-white px-4 py-2 text-sm text-[#606266] hover:border-[#c0c4cc] hover:text-[#409eff]';

/** 首页装修：预览区外框 */
export const ADM_PREVIEW_FRAME =
  'max-h-[min(85vh,920px)] overflow-y-auto overflow-x-hidden rounded border border-[#ebeef5] bg-[#fafafa]';
