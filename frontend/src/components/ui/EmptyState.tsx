import { type ComponentProps, type ReactNode, isValidElement, useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/* ------------------------------------------------------------------ */
/*  Action and Props definitions                                      */
/* ------------------------------------------------------------------ */

export interface EmptyStateAction {
	/** Label displayed on the action button or link */
	label: string;
	/** Optional URL destination for navigation */
	href?: string;
	/** Optional callback when action is clicked */
	onClick?: () => void;
	/** Visual variant for the action (matches Button variant system) */
	variant?: "primary" | "accent" | "outline" | "ghost";
	/** Additional styling classes for the action */
	className?: string;
	/** Optional leading icon for the action */
	icon?: React.ComponentType<{ className?: string }> | ReactNode;
	/** Optional accessible label if different from visible text */
	ariaLabel?: string;
}

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
	/** Accessible title / heading for the empty state */
	title: string;
	/** Contextual guidance describing why the list is empty and what to do */
	description?: ReactNode;
	/** Icon component or custom React element displayed above the heading */
	icon?:
		| React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
		| ReactNode;
	/** Custom class names to apply to the icon */
	iconClassName?: string;
	/** Primary call-to-action */
	action?: EmptyStateAction;
	/** Visual style variant */
	variant?: "dashed" | "card" | "subtle";
	/** Padding and typography size scale */
	size?: "sm" | "md" | "lg";
	/** Semantic heading level for accessibility (default: "h3") */
	headingLevel?: "h2" | "h3" | "h4" | "p";
	/** Additional custom action elements or controls */
	children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Style Maps                                                        */
/* ------------------------------------------------------------------ */

const VARIANT_MAP = {
	dashed: "rounded-xl border border-dashed border-border bg-surface/40 text-center",
	card: "rounded-xl border border-border bg-surface text-center shadow-card",
	subtle: "rounded-xl bg-surface/40 text-center",
} as const;

const SIZE_MAP = {
	sm: "p-5 sm:p-6",
	md: "p-6 sm:p-8",
	lg: "p-8 sm:p-10",
} as const;

const ICON_SIZE_MAP = {
	sm: "size-6 sm:size-7 text-muted",
	md: "size-8 text-muted",
	lg: "size-10 text-muted",
} as const;

const ICON_MARGIN_MAP = {
	sm: "mb-2.5",
	md: "mb-3",
	lg: "mb-4",
} as const;

const HEADING_SIZE_MAP = {
	sm: "text-sm",
	md: "text-base sm:text-lg",
	lg: "text-lg sm:text-xl",
} as const;

const DESCRIPTION_SIZE_MAP = {
	sm: "text-xs",
	md: "text-xs sm:text-sm",
	lg: "text-sm",
} as const;

const ACTION_MARGIN_MAP = {
	sm: "mt-3.5",
	md: "mt-4",
	lg: "mt-5",
} as const;

const ACTION_LINK_BASE =
	"inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer text-sm px-5 h-10 min-h-[44px]";

const ACTION_VARIANT_MAP = {
	primary: "bg-primary text-white shadow-sm hover:brightness-110 active:brightness-95",
	accent: "bg-accent text-white shadow-sm hover:brightness-110 active:brightness-95",
	outline:
		"border-2 border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20",
	ghost: "text-foreground bg-transparent hover:bg-border active:bg-border/80",
} as const;

/* ------------------------------------------------------------------ */
/*  Helper: Render Icon                                               */
/* ------------------------------------------------------------------ */

function renderIcon(
	icon: EmptyStateProps["icon"],
	defaultIconClassName: string,
	customIconClassName?: string,
) {
	if (!icon) return null;

	if (isValidElement(icon)) {
		return icon;
	}

	const IconComponent = icon as React.ComponentType<{
		className?: string;
		"aria-hidden"?: boolean | "true" | "false";
	}>;
	return (
		<IconComponent
			className={cn(defaultIconClassName, customIconClassName)}
			aria-hidden="true"
		/>
	);
}

function renderActionIcon(icon: EmptyStateAction["icon"]) {
	if (!icon) return null;
	if (isValidElement(icon)) return icon;
	const IconComponent = icon as React.ComponentType<{ className?: string }>;
	return <IconComponent className="size-4" />;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
	title,
	description,
	icon,
	iconClassName,
	action,
	variant = "dashed",
	size = "md",
	headingLevel = "h3",
	className,
	children,
	id,
	...props
}: EmptyStateProps) {
	const generatedId = useId();
	const baseId = id ?? generatedId;
	const headingId = `${baseId}-heading`;
	const descriptionId = description ? `${baseId}-desc` : undefined;

	const HeadingTag = headingLevel;

	return (
		<div
			id={baseId}
			role="region"
			aria-labelledby={headingId}
			aria-describedby={descriptionId}
			className={cn(VARIANT_MAP[variant], SIZE_MAP[size], className)}
			{...props}
		>
			{icon && (
				<div className={cn("mx-auto flex items-center justify-center", ICON_MARGIN_MAP[size])}>
					{renderIcon(icon, ICON_SIZE_MAP[size], iconClassName)}
				</div>
			)}

			<HeadingTag
				id={headingId}
				className={cn("font-heading font-bold text-foreground", HEADING_SIZE_MAP[size])}
			>
				{title}
			</HeadingTag>

			{description && (
				<p
					id={descriptionId}
					className={cn("mx-auto mt-1 max-w-md text-muted", DESCRIPTION_SIZE_MAP[size])}
				>
					{description}
				</p>
			)}

			{(action || children) && (
				<div
					className={cn(
						"flex flex-wrap items-center justify-center gap-3",
						ACTION_MARGIN_MAP[size],
					)}
				>
					{action &&
						(action.href ? (
							<Link
								href={action.href}
								aria-label={action.ariaLabel || action.label}
								className={cn(
									ACTION_LINK_BASE,
									ACTION_VARIANT_MAP[action.variant ?? "primary"],
									action.className,
								)}
							>
								{renderActionIcon(action.icon)}
								{action.label}
							</Link>
						) : (
							<Button
								type="button"
								variant={action.variant ?? "primary"}
								size="md"
								onClick={action.onClick}
								aria-label={action.ariaLabel || action.label}
								className={cn("min-h-[44px]", action.className)}
							>
								{renderActionIcon(action.icon)}
								{action.label}
							</Button>
						))}

					{children}
				</div>
			)}
		</div>
	);
}
