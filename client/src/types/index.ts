export interface TemplateType {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'color';
  backgroundColor?: string;
}

export interface PriceStyleType {
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string | number;
}
