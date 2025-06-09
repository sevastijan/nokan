"use client";

import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { BreadcrumbsProps } from "./types";

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <FiChevronRight className="w-4 h-4 text-slate-500 mx-2" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
            >
              {item.icon && <span className="text-slate-500">{item.icon}</span>}
              <span className="font-medium">{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              {item.icon && <span className="text-slate-400">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
