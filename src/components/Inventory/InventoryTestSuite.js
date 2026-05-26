/**
 * Inventory Test Suite Component
 * Provides a UI to run and display test results for inventory validation
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { runAllTests, runTestCategory } from '../../utils/inventoryTestSuite';

const InventoryTestSuite = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const testCategories = [
    { id: 'all', name: 'All Tests', description: 'Run complete test suite' },
    { id: 'materialInward', name: 'Material Inward', description: 'Test material inward validation' },
    { id: 'materialIssue', name: 'Material Issue', description: 'Test material issue validation' },
    { id: 'fgMaterial', name: 'FG Material', description: 'Test finished goods validation' },
    { id: 'fieldValidators', name: 'Field Validators', description: 'Test individual field validators' },
    { id: 'edgeCases', name: 'Edge Cases', description: 'Test edge case handling' }
  ];

  const runTests = async (category = 'all') => {
    setIsRunning(true);
    setSelectedCategory(category);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let results;
      if (category === 'all') {
        results = runAllTests();
      } else {
        const categoryTests = runTestCategory(category);
        results = {
          total: categoryTests.length,
          passed: categoryTests.filter(test => test.passed).length,
          failed: categoryTests.filter(test => !test.passed).length,
          tests: categoryTests
        };
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (passed) => {
    return passed ? (
      <CheckIcon color="success" fontSize="small" />
    ) : (
      <ErrorIcon color="error" fontSize="small" />
    );
  };

  const getTestChip = (passed) => {
    return (
      <Chip
        icon={getTestIcon(passed)}
        label={passed ? 'PASSED' : 'FAILED'}
        color={passed ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    const passPercentage = Math.round((testResults.passed / testResults.total) * 100);
    const progressColor = getProgressColor(passPercentage);

    return (
      <Box sx={{ mt: 3 }}>
        {/* Test Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Test Results Summary
              </Typography>
              <Chip
                label={`${testResults.passed}/${testResults.total} PASSED`}
                color={progressColor}
                variant="outlined"
              />
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {testResults.passed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tests Passed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {testResults.failed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tests Failed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {passPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={passPercentage}
                color={progressColor}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Detailed Test Results */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <BugIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Detailed Test Results
              </Typography>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Test Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Expected</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actual</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.tests.map((test, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {test.testName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {typeof test.expected === 'boolean' ? test.expected.toString() : JSON.stringify(test.expected)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {typeof test.actual === 'boolean' ? test.actual.toString() : JSON.stringify(test.actual)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getTestChip(test.passed)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <SpeedIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Inventory Test Suite
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive testing for inventory validation, error handling, and edge cases
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Test Categories */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Test Categories
          </Typography>
          <Grid container spacing={2}>
            {testCategories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedCategory === category.id ? 2 : 1,
                    borderColor: selectedCategory === category.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Run Tests Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => runTests(selectedCategory)}
              disabled={isRunning}
              size="large"
              sx={{ minWidth: 200 }}
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
            
            {testResults && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => runTests(selectedCategory)}
                disabled={isRunning}
              >
                Re-run
              </Button>
            )}

            {isRunning && (
              <Box sx={{ width: 200 }}>
                <LinearProgress />
              </Box>
            )}
          </Stack>

          {selectedCategory !== 'all' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Running tests for: <strong>{testCategories.find(c => c.id === selectedCategory)?.name}</strong>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {renderTestResults()}

      {/* Test Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Test Coverage
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Validation Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Required field validation<br/>
                • Data type validation<br/>
                • Range and constraint validation<br/>
                • Business rule validation
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Error Handling Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Network error handling<br/>
                • API error handling<br/>
                • Sheet service errors<br/>
                • Authentication errors
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Edge Case Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Empty/null data handling<br/>
                • Invalid date handling<br/>
                • Numeric edge cases<br/>
                • Concurrent operations
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Business Logic Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • Stock availability checks<br/>
                • Duplicate entry detection<br/>
                • Status-based operations<br/>
                • Product existence validation
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryTestSuite;
