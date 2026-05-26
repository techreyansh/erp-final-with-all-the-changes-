import React, { useState } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import WhatsAppModal from './WhatsAppModal';

/**
 * WhatsApp Button Component
 * Reusable button to trigger WhatsApp modal at any workflow stage
 */
const WhatsAppButton = ({ 
  task, 
  stageName, 
  status = 'NEW',
  size = 'small',
  variant = 'icon', // 'icon' or 'button'
  showBadge = false,
  onMessageSent
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Safety check - ensure component always renders something
  if (!task) {
    console.warn('WhatsAppButton: task is missing');
    return null;
  }

  const handleClick = (e) => {
    e?.stopPropagation?.();
    console.log('WhatsApp button clicked:', { 
      taskId: task?.POId || task?.DispatchUniqueId, 
      stageName, 
      status 
    });
    setModalOpen(true);
  };

  const handleMessageSent = (recipients, message) => {
    if (onMessageSent) {
      onMessageSent(recipients, message);
    }
  };

  if (variant === 'button') {
    return (
      <>
        <Tooltip title="Send WhatsApp Update" arrow>
          <IconButton
            onClick={handleClick}
            color="success"
            size={size}
            sx={{
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
              color: '#25D366 !important',
              minWidth: '40px',
              minHeight: '40px',
              '&:hover': {
                backgroundColor: 'rgba(37, 211, 102, 0.25) !important',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {showBadge ? (
              <Badge badgeContent=" " color="success" variant="dot">
                <WhatsAppIcon sx={{ fontSize: '20px !important' }} />
              </Badge>
            ) : (
              <WhatsAppIcon sx={{ fontSize: '20px !important' }} />
            )}
          </IconButton>
        </Tooltip>
        {modalOpen && (
          <WhatsAppModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            task={task}
            stageName={stageName || 'STORE1'}
            status={status}
            onMessageSent={handleMessageSent}
          />
        )}
      </>
    );
  }

  // Default icon variant - ALWAYS render this
  return (
    <>
      <Tooltip title="Send WhatsApp Update" arrow>
        <IconButton
          onClick={handleClick}
          color="success"
          size={size}
          sx={{
            color: '#25D366 !important',
            minWidth: '40px',
            minHeight: '40px',
            '&:hover': {
              backgroundColor: 'rgba(37, 211, 102, 0.2) !important',
              transform: 'scale(1.15)',
              color: '#1da851 !important'
            },
            transition: 'all 0.2s ease-in-out',
            border: '1px solid rgba(37, 211, 102, 0.3)',
            '& svg': {
              fontSize: '20px !important'
            }
          }}
        >
          {showBadge ? (
            <Badge badgeContent=" " color="success" variant="dot">
              <WhatsAppIcon sx={{ fontSize: '20px !important' }} />
            </Badge>
          ) : (
            <WhatsAppIcon sx={{ fontSize: '20px !important' }} />
          )}
        </IconButton>
      </Tooltip>
      {modalOpen && (
        <WhatsAppModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          task={task}
          stageName={stageName || 'STORE1'}
          status={status}
          onMessageSent={handleMessageSent}
        />
      )}
    </>
  );
};

export default WhatsAppButton;
