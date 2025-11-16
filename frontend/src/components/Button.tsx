import { ComponentPropsWithoutRef, ElementType } from 'react';
import clsx from 'clsx';
import '../styles/button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'ref'>;

const Button = <T extends ElementType = 'button'>(props: ButtonProps<T>) => {
  const { as, variant = 'primary', size = 'md', fullWidth, className, ...rest } = props;
  const Component = as ?? 'button';

  return (
    <Component
      className={clsx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, fullWidth && 'ds-button--full', className)}
      {...rest}
    />
  );
};

export default Button;
