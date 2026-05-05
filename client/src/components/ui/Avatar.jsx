import React from 'react';
import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', style = {} }) {
  const sizeClass = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl' }[size];
  return (
    <div className={`avatar ${sizeClass}`} title={name} style={style}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        : getInitials(name)}
    </div>
  );
}
