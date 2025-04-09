import { Select, type SelectProps } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import ActionIcon from '@/ActionIcon';
import CopyButton from '@/CopyButton';
import SyntaxHighlighter from '@/Highlighter/SyntaxHighlighter';
import { languageMap } from '@/hooks/useHighlight';
import { HighlighterProps } from './type';

// 将样式定义直接放在组件文件中
const useStyles = createStyles(({ css, token }) => {
  return {
    container: css`
      position: relative;
      overflow: hidden;
      margin-block: 1em;
      border-radius: calc(var(--lobe-markdown-border-radius) * 1px);
      box-shadow: 0 0 0 1px var(--lobe-markdown-border-color) inset;
      max-height: 80vh; /* 限制最大高度，确保有滚动效果 */
      display: flex;
      flex-direction: column;
    `,
    
    stickyHeader: css`
      position: sticky;
      top: 0;
      padding: 8px 12px;
      background: ${token.colorBgContainer};
      border-bottom: 1px solid ${token.colorBorderSecondary};
      z-index: 10;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      transition: box-shadow 0.3s ease;
    `,
    
    codeContent: css`
      overflow: auto;
      max-height: calc(80vh - 40px); /* 最大高度减去头部高度 */
    `,
    
    select: css`
      font-size: 12px;
      color: ${token.colorTextSecondary};
      margin: 0;
    `,
  };
});

const options: SelectProps['options'] = languageMap.map((item) => ({
  label: item,
  value: item.toLowerCase(),
}));

interface HighlighterFullFeaturedProps extends Omit<HighlighterProps, 'children'> {
  content: string;
}

export const HighlighterFullFeatured = memo<HighlighterFullFeaturedProps>(
  ({
    content,
    language,
    showLanguage,
    className,
    style,
    allowChangeLanguage = false,
    fileName,
    icon,
    actionsRender,
    copyable,
    type,
    defalutExpand = true,
    bodyRender,
    enableTransformer,
    ...rest
  }) => {
    const [expand, setExpand] = useState(defalutExpand);
    const [lang, setLang] = useState(language);
    const { styles, cx } = useStyles();

    const size = { blockSize: 24, fontSize: 14, strokeWidth: 2 };

    const origianlActions = copyable && (
      <CopyButton content={content} placement="left" size={size} />
    );

    const actions = actionsRender
      ? actionsRender({
          actionIconSize: size,
          content,
          language,
          originalNode: origianlActions,
        })
      : origianlActions;

    const originalBody = (
      <SyntaxHighlighter enableTransformer={enableTransformer} language={lang?.toLowerCase()}>
        {content}
      </SyntaxHighlighter>
    );

    const body = bodyRender
      ? bodyRender({ content, language: lang, originalNode: originalBody })
      : originalBody;

    return (
      <div
        className={cx(styles.container, className)}
        data-code-type="highlighter"
        style={style}
        {...rest}
      >
        <Flexbox 
          align={'center'} 
          className={styles.stickyHeader} 
          horizontal 
          justify={'space-between'}
        >
          <ActionIcon
            icon={expand ? ChevronDown : ChevronRight}
            onClick={() => setExpand(!expand)}
            size={{ blockSize: 24, fontSize: 14, strokeWidth: 3 }}
          />
          {allowChangeLanguage && !fileName ? (
            showLanguage && (
              <Select
                className={styles.select}
                onSelect={setLang}
                options={options}
                size={'small'}
                suffixIcon={false}
                value={lang.toLowerCase()}
                variant={'borderless'}
              />
            )
          ) : (
            <Flexbox
              align={'center'}
              className={styles.select}
              gap={2}
              horizontal
              justify={'center'}
            >
              {icon}
              <span>{fileName || lang}</span>
            </Flexbox>
          )}
          <Flexbox align={'center'} flex={'none'} gap={4} horizontal>
            {actions}
          </Flexbox>
        </Flexbox>
        <div 
          className={styles.codeContent}
          style={expand ? {} : { height: 0, overflow: 'hidden' }}
        >
          {body}
        </div>
      </div>
    );
  },
);

export default HighlighterFullFeatured;
