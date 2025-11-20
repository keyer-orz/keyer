import {
  Popover,
  Portal,
  IconButton,
  type IconButtonProps,
} from "keyerext"
import * as React from "react"
import { HiOutlineInformationCircle } from "react-icons/hi"

export interface ToggleTipProps extends Omit<Popover.RootProps, "children"> {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement | null>
  content?: React.ReactNode
  contentProps?: Popover.ContentProps
  children?: React.ReactNode
}

export const ToggleTip = React.forwardRef<HTMLDivElement, ToggleTipProps>(
  function ToggleTip(props, ref) {
    const {
      showArrow,
      children,
      portalled = true,
      content,
      contentProps,
      portalRef,
      ...rest
    } = props

    return (
      <Popover.Root {...rest}>
        <Popover.Trigger asChild>
          {children}
        </Popover.Trigger>
        <Portal container={portalRef} disabled={!portalled}>
          <Popover.Positioner>
            <Popover.Content
              width="auto"
              px="2"
              py="1"
              textStyle="xs"
              rounded="sm"
              ref={ref}
              {...contentProps}
            >
              {showArrow && (
                <Popover.Arrow>
                  <Popover.ArrowTip />
                </Popover.Arrow>
              )}
              {content}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    )
  },
)

export interface InfoTipProps extends Partial<ToggleTipProps> {
  buttonProps?: IconButtonProps | undefined
}

export const InfoTip = React.forwardRef<HTMLDivElement, InfoTipProps>(
  function InfoTip(props, ref) {
    const { children, buttonProps, ...rest } = props
    return (
      <ToggleTip content={children} {...rest} ref={ref}>
        <IconButton
          variant="ghost"
          aria-label="info"
          size="xs"
          colorScheme="gray"
          {...buttonProps}
        >
          <HiOutlineInformationCircle />
        </IconButton>
      </ToggleTip>
    )
  },
)
