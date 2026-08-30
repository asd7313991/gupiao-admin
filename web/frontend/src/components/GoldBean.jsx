import { Coins } from "lucide-react";

// 金豆图标(还原为金币样式)
export const GoldBean = ({ className = "", ...props }) => (
  <Coins className={className} {...props} />
);

export default GoldBean;
