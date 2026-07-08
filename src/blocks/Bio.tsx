import { Card, CardBody, Typography } from '@your-org/design-system';
import type { Block } from '../types';
import { optStr, str } from './props';
import styles from './blocks.module.css';

export function Bio({ block }: { block: Block }) {
  const title = optStr(block.props.title);
  // Split on blank lines into paragraphs so line breaks survive.
  const paragraphs = str(block.props.body)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Card elevation="flat">
      <CardBody>
        {title && (
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
        )}
        <div className={styles.bioBody}>
          {paragraphs.map((text, i) => (
            <Typography key={i} variant="body1">
              {text}
            </Typography>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
