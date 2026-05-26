import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import employeeService from '../../services/employeeService';

const PerformanceTab = ({ employeeCode, performance }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeCode) {
      loadPerformanceData();
    }
  }, [employeeCode, timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const metrics = await employeeService.getPerformanceMetrics(employeeCode);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'info';
    return 'error';
  };

  const getScoreText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  // Calculate overall statistics
  const stats = {
    averageScore: performance.length > 0 
      ? Math.round(performance.reduce((sum, p) => sum + (parseFloat(p.Score) || 0), 0) / performance.length)
      : 0,
    latestScore: performance.length > 0 
      ? parseFloat(performance[performance.length - 1]?.Score) || 0
      : 0,
    improvement: performance.length > 1 
      ? parseFloat(performance[performance.length - 1]?.Score) - parseFloat(performance[performance.length - 2]?.Score)
      : 0,
    totalReviews: performance.length
  };

  // Prepare chart data
  const chartData = performanceMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    score: metric.score,
    target: metric.target
  }));

  // Radar chart data for skills assessment
  const skillsData = [
    { skill: 'Technical Skills', score: 85, fullMark: 100 },
    { skill: 'Communication', score: 78, fullMark: 100 },
    { skill: 'Leadership', score: 72, fullMark: 100 },
    { skill: 'Problem Solving', score: 88, fullMark: 100 },
    { skill: 'Teamwork', score: 82, fullMark: 100 },
    { skill: 'Initiative', score: 75, fullMark: 100 }
  ];

  return (
    <Box>
      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.averageScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.latestScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimelineIcon sx={{ 
                fontSize: 40, 
                color: stats.improvement >= 0 ? 'success.main' : 'error.main', 
                mb: 1 
              }} />
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                color: stats.improvement >= 0 ? 'success.main' : 'error.main' 
              }}>
                {stats.improvement > 0 ? '+' : ''}{stats.improvement.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Improvement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.totalReviews}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon />
                  Performance Trend
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    label="Time Range"
                  >
                    <MenuItem value="3months">3 Months</MenuItem>
                    <MenuItem value="6months">6 Months</MenuItem>
                    <MenuItem value="1year">1 Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {chartData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}%`, 
                          name === 'score' ? 'Performance Score' : 'Target'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#2196f3" 
                        strokeWidth={3}
                        dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#ff9800" 
                        strokeDasharray="5 5"
                        dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  No performance trend data available
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Radar Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon />
                Skills Assessment
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2196f3"
                      fill="#2196f3"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance History Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Performance History
              </Typography>
              
              {performance.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Review Date</TableCell>
                        <TableCell>Metric</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Comments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.slice().reverse().map((review, index) => {
                        const score = parseFloat(review.Score) || 0;
                        const target = parseFloat(review.Target) || 100;
                        const progress = (score / target) * 100;
                        
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              {new Date(review.Date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {review.Metric || 'Overall Performance'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {score}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {target}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getScoreText(score)}
                                color={getScoreColor(score)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ width: 150 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(progress, 100)}
                                  sx={{ 
                                    flex: 1, 
                                    height: 8, 
                                    borderRadius: 4,
                                    backgroundColor: 'grey.200'
                                  }}
                                  color={getScoreColor(score)}
                                />
                                <Typography variant="caption">
                                  {Math.round(progress)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {review.Comments || review.Notes || 'No comments'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No Performance Reviews
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance reviews will appear here once they are completed.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Goals and Targets */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Goals & Targets
              </Typography>
              
              <Box sx={{ space: 2 }}>
                {[
                  { goal: 'Quarterly Performance Target', current: 85, target: 90 },
                  { goal: 'Project Completion Rate', current: 92, target: 95 },
                  { goal: 'Team Collaboration Score', current: 88, target: 85 },
                  { goal: 'Skill Development', current: 75, target: 80 }
                ].map((item, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.goal}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.current}/{item.target}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.current / item.target) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'grey.200'
                      }}
                      color={item.current >= item.target ? 'success' : 'primary'}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Achievements */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Achievements
              </Typography>
              
              <Box>
                {[
                  { 
                    title: 'Project Excellence Award', 
                    date: '2024-01-15',
                    description: 'Outstanding performance in Q4 project delivery'
                  },
                  { 
                    title: 'Team Player Recognition', 
                    date: '2023-12-20',
                    description: 'Exceptional collaboration and support to team members'
                  },
                  { 
                    title: 'Innovation Bonus', 
                    date: '2023-11-10',
                    description: 'Implemented cost-saving process improvement'
                  }
                ].map((achievement, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'success.lighter' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <StarIcon sx={{ color: 'success.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {achievement.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {achievement.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(achievement.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceTab;
