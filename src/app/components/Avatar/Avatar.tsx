import React from "react";
import Image from "next/image";
import { FaUser } from "react-icons/fa";
import { AvatarProps } from "./types";

const Avatar = ({ src, alt, size = 24 }: AvatarProps) => {
  const avatarSize = size;

  return (
    <>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full"
          onError={(e: any) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <FaUser className="w-6 h-6 text-gray-400" />
      )}
    </>
  );
};

export default Avatar;
