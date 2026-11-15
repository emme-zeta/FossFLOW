import React, { useMemo, memo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import {
  PROJECTED_TILE_SIZE,
  DEFAULT_LABEL_HEIGHT,
  MARKDOWN_EMPTY_VALUE
} from 'src/config';
import { getTilePosition } from 'src/utils';
import { useIcon } from 'src/hooks/useIcon';
import { ViewItem } from 'src/types';
import { useModelItem } from 'src/hooks/useModelItem';
import { ExpandableLabel } from 'src/components/Label/ExpandableLabel';
import { RichTextEditor } from 'src/components/RichTextEditor/RichTextEditor';
import { useLiveStatus, LIVE_STATUS_COLORS } from 'src/stores/liveStatusStore';

interface Props {
  node: ViewItem;
  order: number;
}

export const Node = memo(({ node, order }: Props) => {
  const modelItem = useModelItem(node.id);
  const { iconComponent } = useIcon(modelItem?.icon);
  const liveStatus = useLiveStatus(modelItem?.statusKey || undefined);

  const position = useMemo(() => {
    return getTilePosition({
      tile: node.tile,
      origin: 'BOTTOM'
    });
  }, [node.tile]);

  const description = useMemo(() => {
    if (
      !modelItem ||
      modelItem.description === undefined ||
      modelItem.description === MARKDOWN_EMPTY_VALUE
    )
      return null;

    return modelItem.description;
  }, [modelItem?.description]);

  // If modelItem doesn't exist, don't render the node
  if (!modelItem) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: order
      }}
    >
      <Box
        sx={{ 
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          left: position.x,
          top: position.y - (PROJECTED_TILE_SIZE.height / 2),
        }}
      >
        {(modelItem?.name || description) && (
          <Box>
            <ExpandableLabel
              maxWidth={250}
              expandDirection="BOTTOM"
              labelHeight={node.labelHeight ?? DEFAULT_LABEL_HEIGHT}
            >
              <Stack spacing={1}>
                {modelItem.name && (
                  <Typography fontWeight={600}>{modelItem.name}</Typography>
                )}
                {modelItem.description &&
                  modelItem.description !== MARKDOWN_EMPTY_VALUE && (
                    <RichTextEditor value={modelItem.description} readOnly />
                  )}
              </Stack>
            </ExpandableLabel>
          </Box>
        )}
        {iconComponent && (
          <Box
            sx={{
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {iconComponent}
          </Box>
        )}
        {liveStatus && (
          <Box
            title={`${modelItem.statusKey}: ${liveStatus}`}
            sx={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 2,
              left: PROJECTED_TILE_SIZE.width * 0.18,
              top: -PROJECTED_TILE_SIZE.height * 0.9,
              width: 34,
              height: 34
            }}
          >
            {(liveStatus === 'error' || liveStatus === 'running') && (
              <Box
                className="fossflow-status-pulse"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  bgcolor: LIVE_STATUS_COLORS[liveStatus],
                  animation: 'fossflow-pulse 1.6s ease-out infinite'
                }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                bgcolor: LIVE_STATUS_COLORS[liveStatus],
                border: '4px solid white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
});
