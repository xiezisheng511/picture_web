import type { Tool } from '@/types';

export const TOOLS: Tool[] = [
  {
    id: 'bg-color',
    icon: '🎨',
    zhTitle: '换背景颜色',
    enTitle: 'Change Background',
    zhDesc: '一键更换证件照、商品图底色',
    enDesc: 'Swap photo background in one click',
    path: '/tools/bg-color',
  },
  {
    id: 'remove-watermark',
    icon: '🧽',
    zhTitle: '去水印',
    enTitle: 'Remove Watermark',
    zhDesc: '智能修复图片水印区域',
    enDesc: 'Smart inpainting for watermark areas',
    path: '/tools/remove-watermark',
  },
  {
    id: 'edit',
    icon: '✂️',
    zhTitle: '基础编辑',
    enTitle: 'Basic Editor',
    zhDesc: '裁剪、缩放、压缩、格式转换',
    enDesc: 'Crop, resize, compress, convert',
    path: '/tools/edit',
  },
  {
    id: 'ai-cutout',
    icon: '🤖',
    zhTitle: 'AI 一键抠图',
    enTitle: 'AI Cutout',
    zhDesc: '高精度人像/物品抠图',
    enDesc: 'High-accuracy subject extraction',
    path: '/tools/ai-cutout',
    premium: true,
  },
];