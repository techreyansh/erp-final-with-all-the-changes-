import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  Divider,
  Link
} from '@mui/material';
import { ArrowRight, Info } from '@mui/icons-material';

const OAuthSetupGuide = () => {
  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Info color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" component="h2">
          Google Sign-In Setup
        </Typography>
      </Box>
      
      <Typography variant="body1" paragraph>
        To sign in with Google, set up OAuth 2.0 credentials and use the Client ID in the app config.
        Follow these steps:
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="1. Go to Google Cloud Console"
            secondary={
              <Link href="https://console.cloud.google.com" target="_blank" rel="noopener">
                https://console.cloud.google.com
              </Link>
            }
          />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="2. Create a new project or select an existing one"
          />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="3. Enable the Google Identity / OAuth APIs"
            secondary="Go to 'APIs & Services' > 'Library' and enable required APIs for sign-in"
          />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="4. Configure the OAuth consent screen"
            secondary="Go to 'APIs & Services' > 'OAuth consent screen'"
          />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="5. Create OAuth 2.0 Client ID"
            secondary="Go to 'APIs & Services' > 'Credentials' > 'Create Credentials' > 'OAuth client ID'"
          />
        </ListItem>

        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="6. Set application type to 'Web application'"
          />
        </ListItem>

        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="7. Add JavaScript origins"
            secondary="Add http://localhost:3000 for development"
          />
        </ListItem>

        <Divider component="li" />
        
        <ListItem>
          <ListItemIcon>
            <ArrowRight />
          </ListItemIcon>
          <ListItemText
            primary="8. Copy the Client ID"
            secondary="Update the clientId in src/config/oauthConfig.js with your Client ID"
          />
        </ListItem>
      </List>

      <Typography variant="body2" color="text.secondary" mt={3}>
        Once you've set up your OAuth credentials and updated the configuration file, restart the application to apply the changes.
      </Typography>
    </Paper>
  );
};

export default OAuthSetupGuide; 