import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Switch,
    FormControlLabel
} from '@mui/material';
import { Add, Edit, Delete, Check, Close } from '@mui/icons-material';
import { db } from '../../services/db'; // Ensure this service can handle generic requests or add getPlans to it
import { useSnackbar } from 'notistack';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    active: boolean;
}

const PlatformPlansView: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [open, setOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            // Assuming we will add this method to db service or use a generic fetcher
            // For now, let's assume we might need to use a raw fetch or extend the DB service
            // const response = await fetch('/api/v1/plans', { headers: { 'Authorization': `Bearer ${token}` } });
            // Since we don't have the token handy in this view easily without context, 
            // we should ideally use the db service.
            // Let's assume db.getPlans() exists or we mock it for now until we update db service.
            // For this iteration, I'll allow the build to fail if db.getPlans isn't there, 
            // and then I'll go fix the db service.
            const response = await fetch('/api/v1/plans', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            } else {
                enqueueSnackbar('Failed to fetch plans', { variant: 'error' });
            }
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Error fetching plans', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const method = currentPlan.id ? 'PUT' : 'POST';
            const url = currentPlan.id ? `/api/v1/plans/${currentPlan.id}` : '/api/v1/plans';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(currentPlan)
            });

            if (response.ok) {
                enqueueSnackbar('Plan saved', { variant: 'success' });
                fetchPlans();
                setOpen(false);
            } else {
                enqueueSnackbar('Failed to save plan', { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error saving plan', { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const response = await fetch(`/api/v1/plans/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                enqueueSnackbar('Plan deleted', { variant: 'success' });
                fetchPlans();
            }
        } catch (error) {
            enqueueSnackbar('Error deleting plan', { variant: 'error' });
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Subscription Plans</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => { setCurrentPlan({ active: true, features: [] }); setOpen(true); }}
                >
                    Create Plan
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Interval</TableCell>
                            <TableCell>Features</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell>{plan.name}</TableCell>
                                <TableCell>${plan.price}</TableCell>
                                <TableCell>{plan.interval}</TableCell>
                                <TableCell>
                                    {plan.features?.map((f, i) => (
                                        <Chip key={i} label={f} size="small" style={{ marginRight: 4 }} />
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={plan.active ? 'Active' : 'Inactive'}
                                        color={plan.active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => { setCurrentPlan(plan); setOpen(true); }}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(plan.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentPlan.id ? 'Edit Plan' : 'New Plan'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Plan Name"
                        fullWidth
                        value={currentPlan.name || ''}
                        onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Price"
                        type="number"
                        fullWidth
                        value={currentPlan.price || 0}
                        onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                    />
                    <TextField
                        margin="dense"
                        label="Features (comma separated)"
                        fullWidth
                        multiline
                        rows={3}
                        value={Array.isArray(currentPlan.features) ? currentPlan.features.join(', ') : currentPlan.features || ''}
                        onChange={(e) => setCurrentPlan({ ...currentPlan, features: e.target.value.split(',').map(s => s.trim()) })}
                        helperText="Enter features separated by commas"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={currentPlan.active || false}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, active: e.target.checked })}
                            />
                        }
                        label="Active"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} color="primary" variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlatformPlansView;
