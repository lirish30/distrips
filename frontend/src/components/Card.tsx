import { ComponentPropsWithoutRef, ElementType } from 'react';
import clsx from 'clsx';
import { spacingValue, theme } from '../theme';
import '../styles/card.css';

type CardVariant = 'default' | 'tinted' | 'outline';

type CardProps<T extends ElementType> = {
  as?: T;
  padding?: keyof typeof theme.spacing;
  variant?: CardVariant;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'ref'>;

const Card = <T extends ElementType = 'div'>(props: CardProps<T>) => {
  const { as, padding = 'lg', variant = 'default', className, style, ...rest } = props;
  const Component = as ?? 'div';
  const shadow = variant === 'outline' ? 'none' : theme.shadows.soft;

  return (
    <Component
      className={clsx('ds-card', variant !== 'default' && `ds-card--${variant}`, className)}
      style={{
        padding: spacingValue(padding),
        borderRadius: theme.radii.lg,
        boxShadow: shadow,
        ...style
      }}
      {...rest}
    />
  );
};

export default Card;
