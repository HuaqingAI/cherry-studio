import type { CompoundIcon, CompoundIconProps } from '../../types'
import { HthAvatar } from './avatar'
import { HthLight } from './light'

const Hth = ({ variant, className, ...props }: CompoundIconProps) => {
  if (variant === 'light') return <HthLight {...props} className={className} />
  return <HthLight {...props} className={className} />
}

export const HthIcon: CompoundIcon = /*#__PURE__*/ Object.assign(Hth, {
  Avatar: HthAvatar,
  colorPrimary: '#000000'
})

export default HthIcon
