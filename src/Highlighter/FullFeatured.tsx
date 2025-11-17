'use client';

import { cva } from 'class-variance-authority';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  ReactNode,
  RefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Flexbox } from 'react-layout-kit';

import ActionIcon from '@/ActionIcon';
import CopyButton from '@/CopyButton';
import { getCodeLanguageDisplayName, getCodeLanguageFilename } from '@/Highlighter/const';
import MaterialFileTypeIcon from '@/MaterialFileTypeIcon';
import Text from '@/Text';

import LangSelect from './LangSelect';
import { useStyles } from './style';
import { HighlighterProps } from './type';

const useFloatingActions = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [isSticky, setIsSticky] = useState(false);
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top;
      const containerBottom = rect.bottom;
      const containerHeight = rect.height;

      // 按钮高度（包含 padding），约 40px
      const buttonHeight = 40;

      // 如果代码框顶部在视口上方，且底部在视口内
      if (containerTop < 0 && containerBottom > buttonHeight) {
        setIsSticky(true);
        // 计算悬浮按钮的位置
        // offset 是按钮相对于容器顶部的距离
        const scrolledDistance = Math.abs(containerTop);
        // 确保按钮不会超出容器底部
        const maxOffset = containerHeight - buttonHeight;
        const offset = Math.min(scrolledDistance, maxOffset);
        setStickyTop(offset);
      } else {
        setIsSticky(false);
        setStickyTop(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // 也监听 resize 事件，以应对窗口大小变化
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // 初始检查

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [containerRef]);

  return { isSticky, stickyTop };
};

interface HeaderLanguageProps {
  allowChangeLanguage: boolean;
  displayName: string;
  fileName?: string;
  filetype: string;
  icon?: ReactNode;
  language: string;
  setLanguage?: (language: string) => void;
  showLanguage?: boolean;
}

const HeaderLanguage = memo<HeaderLanguageProps>(
  ({
    allowChangeLanguage,
    displayName,
    fileName,
    filetype,
    icon,
    language,
    setLanguage,
    showLanguage,
  }) => {
    if (!showLanguage) return;

    return (
      <Flexbox
        align={'center'}
        className={'languageTitle'}
        flex={1}
        gap={4}
        horizontal
        justify={'center'}
      >
        {allowChangeLanguage && !fileName ? (
          <LangSelect onSelect={setLanguage} value={language.toLowerCase()} />
        ) : (
          <>
            {icon || (
              <MaterialFileTypeIcon
                fallbackUnknownType={false}
                filename={filetype}
                size={18}
                type={'file'}
                variant={'raw'}
              />
            )}
            <Text ellipsis fontSize={13}>
              {displayName}
            </Text>
          </>
        )}
      </Flexbox>
    );
  },
  (prev, next) =>
    prev.allowChangeLanguage === next.allowChangeLanguage &&
    prev.displayName === next.displayName &&
    prev.fileName === next.fileName &&
    prev.filetype === next.filetype &&
    prev.icon === next.icon &&
    prev.language === next.language &&
    prev.setLanguage === next.setLanguage &&
    prev.showLanguage === next.showLanguage,
);

interface HighlighterFullFeaturedProps
  extends Omit<HighlighterProps, 'children' | 'bodyRender' | 'enableTransformer'> {
  content: string;
  setLanguage?: (language: string) => void;
}

export const HighlighterFullFeatured = memo<HighlighterFullFeaturedProps & { children: ReactNode }>(
  ({
    content,
    language,
    setLanguage,
    showLanguage,
    className,
    style,
    allowChangeLanguage = false,
    fileName,
    icon,
    actionsRender,
    copyable,
    variant,
    shadow,
    wrap,
    defaultExpand = true,
    children,
    ...rest
  }) => {
    const [expand, setExpand] = useState(defaultExpand);
    const { styles, cx } = useStyles();
    const contentRef = useRef(content);
    const containerRef = useRef<HTMLDivElement>(null);
    const { isSticky, stickyTop } = useFloatingActions(containerRef);

    useEffect(() => {
      contentRef.current = content;
    }, [content]);

    const getContent = useCallback(() => contentRef.current, []);

    const variants = useMemo(
      () =>
        cva(styles.root, {
          defaultVariants: {
            shadow: false,
            variant: 'filled',
            wrap: false,
          },
          /* eslint-disable sort-keys-fix/sort-keys-fix */
          variants: {
            variant: {
              filled: styles.filled,
              outlined: styles.outlined,
              borderless: styles.borderless,
            },
            shadow: {
              false: undefined,
              true: styles.shadow,
            },
            wrap: {
              false: styles.nowrap,
              true: undefined,
            },
          },
          /* eslint-enable sort-keys-fix/sort-keys-fix */
        }),
      [styles],
    );

    const headerVariants = useMemo(
      () =>
        cva(styles.headerRoot, {
          defaultVariants: {
            variant: 'filled',
          },
          /* eslint-disable sort-keys-fix/sort-keys-fix */
          variants: {
            variant: {
              filled: cx(styles.headerFilled, styles.headerOutlined),
              outlined: styles.headerOutlined,
              borderless: styles.headerBorderless,
            },
          },
          /* eslint-enable sort-keys-fix/sort-keys-fix */
        }),
      [styles],
    );

    const bodyVariants = useMemo(
      () =>
        cva(styles.bodyRoot, {
          defaultVariants: {
            expand: true,
          },
          variants: {
            expand: {
              false: styles.bodyCollapsed,
              true: styles.bodyExpand,
            },
          },
        }),
      [styles],
    );

    const originalActions = useMemo(() => {
      if (!copyable) return;
      return <CopyButton content={getContent} size={'small'} />;
    }, [copyable, getContent]);

    const actions = useMemo(() => {
      if (!actionsRender) return originalActions;
      return actionsRender({
        actionIconSize: 'small',
        content,
        getContent,
        language,
        originalNode: originalActions,
      });
    }, [actionsRender, content, getContent, language, originalActions]);

    const displayName = useMemo(() => {
      if (fileName) return fileName;
      return getCodeLanguageDisplayName(language);
    }, [fileName, language]);

    const filetype = useMemo(() => {
      if (fileName) return fileName;
      return getCodeLanguageFilename(language);
    }, [fileName, language]);

    const handleToggleExpand = useCallback(() => {
      setExpand((prev) => !prev);
    }, []);

    return (
      <Flexbox
        className={cx(variants({ shadow, variant, wrap }), className)}
        data-code-type="highlighter"
        ref={containerRef}
        style={style}
        {...rest}
      >
        <Flexbox
          align={'center'}
          className={headerVariants({ variant })}
          horizontal
          justify={'space-between'}
        >
          <ActionIcon
            icon={expand ? ChevronDown : ChevronRight}
            onClick={handleToggleExpand}
            size={'small'}
          />
          <HeaderLanguage
            allowChangeLanguage={allowChangeLanguage}
            displayName={displayName}
            fileName={fileName}
            filetype={filetype}
            icon={icon}
            language={language}
            setLanguage={setLanguage}
            showLanguage={showLanguage}
          />
          <Flexbox
            align={'center'}
            className={cx(styles.actionsWrapper, isSticky && styles.actionsSticky)}
            flex={'none'}
            gap={4}
            horizontal
            style={isSticky ? { top: stickyTop } : undefined}
          >
            {actions}
          </Flexbox>
        </Flexbox>
        <Flexbox className={bodyVariants({ expand })}>{children}</Flexbox>
      </Flexbox>
    );
  },
);

export default HighlighterFullFeatured;
