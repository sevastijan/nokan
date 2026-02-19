import { Fragment } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>'")\]]+)/g;

interface LinkifyTextProps {
	text: string;
}

const LinkifyText = ({ text }: LinkifyTextProps) => {
	const parts = text.split(URL_REGEX);

	return (
		<>
			{parts.map((part, i) =>
				URL_REGEX.test(part) ? (
					<a
						key={i}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="text-purple-400 hover:text-purple-300 underline underline-offset-2 break-all"
						onClick={(e) => e.stopPropagation()}
					>
						{part}
					</a>
				) : (
					<Fragment key={i}>{part}</Fragment>
				)
			)}
		</>
	);
};

export default LinkifyText;
