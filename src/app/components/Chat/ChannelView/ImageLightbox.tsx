'use client';

import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
	src: string | null;
	alt?: string;
	onClose: () => void;
}

const ImageLightbox = ({ src, alt = 'Image', onClose }: ImageLightboxProps) => {
	return (
		<Transition show={!!src} as={Fragment}>
			<Dialog as="div" className="relative z-[70]" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
				</TransitionChild>

				<div className="fixed inset-0 flex items-center justify-center p-4">
					<TransitionChild
						as={Fragment}
						enter="ease-out duration-200"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-150"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel className="relative">
							{/* Close button */}
							<button
								onClick={onClose}
								className="absolute -top-10 right-0 p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>

							{/* Download button */}
							{src && (
								<a
									href={`${src}${src.includes('?') ? '&' : '?'}action=download`}
									className="absolute -top-10 right-10 p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
									title="Pobierz"
								>
									<Download className="w-5 h-5" />
								</a>
							)}

							{/* Image */}
							{src && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={src}
									alt={alt}
									className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
								/>
							)}
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
};

export default ImageLightbox;
