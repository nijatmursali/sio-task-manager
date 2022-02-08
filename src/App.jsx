import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Form, Schema, Button, IconButton, Table, Pagination, DatePicker, Divider, Container, Content, Grid, Row, Col, SelectPicker } from 'rsuite';
import { PlayOutline as PlayIcon, PauseOutline as PauseIcon, Edit as EditIcon, Trash as TrashIcon, Check as CheckIcon } from '@rsuite/icons';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'rsuite/dist/rsuite.min.css';

function App() {
    const formInitialValues = {
        start_time: new Date(),
        end_time: new Date(),
    };
    const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);
    const [isStart, setIsStart] = useState(false);
    const [startUUID, setStartUUID] = useState(null);
    const [formValues, setFormValues] = useState(formInitialValues);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [records, setRecords] = useState([]);
    const [chartType, setChartType] = useState('months');
    const [chartMonth, setChartMonth] = useState(new Date().getMonth());
    const [chartYear, setChartYear] = useState(new Date().getFullYear());
    const [chartData, setChartData] = useState(null);

    /**
     * Initialize Form Schema Validation
     */
    const formModel = Schema.Model({
        start_time: Schema.Types.DateType().isRequired(),
        end_time: Schema.Types.DateType().isRequired(),
    });

    /**
     * Initialize ChartJS
     */
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    );
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Working Hours Diagram',
            },
        },
    };

    /**
     * Initialize Chart Data
     */
    const initChartData = useCallback(() => {
        let chartLabels = [];
        if (chartType === 'days') {
            for (let i = 1; i <= daysInMonth(chartMonth + 1, chartYear); i++) {
                chartLabels.push(i);
            }
        } else if (chartType === 'months') {
            chartLabels = monthNames;
        }
        setChartData({
            labels: chartType === 'days' ? chartLabels.map(label => `${label} ${monthNames[chartMonth]}`) : chartLabels,
            datasets: [
                {
                    label: 'Hours',
                    data: chartLabels.map((day, month) => {
                        // Start Date
                        const startDate = new Date();
                        startDate.setHours(0, 0, 0);
                        startDate.setDate(chartType === 'days' ? day : 1);
                        startDate.setMonth(chartType === 'days' ? chartMonth : month);
                        startDate.setFullYear(chartYear);
    
                        // End Date
                        const endDate = new Date();
                        endDate.setHours(23, 59, 59);
                        endDate.setDate(chartType === 'days' ? day : daysInMonth(month + 1, chartYear));
                        endDate.setMonth(chartType === 'days' ? chartMonth : month);
                        endDate.setFullYear(chartYear);
    
                        // Calculate Hours
                        const hours = records.filter(record => startDate <= new Date(record.start_time) && new Date(record.end_time) <= endDate).reduce((prevValue, currValue) => {
                            return prevValue + Math.ceil((new Date(currValue.end_time) - new Date(currValue.start_time)) / (1000 * 60 * 60));
                        }, 0);
    
                        // Return Hours
                        return hours;
                    }),
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                },
            ],
        });
    }, [chartType, chartMonth, chartYear, monthNames, records]);

    /**
     * Initialize Chart Data
     */
    useEffect(() => {
        initChartData();
    }, [initChartData]);

    /**
     * First Time Open Page
     */
    useEffect(() => {
        const records = (JSON.parse(localStorage.getItem('records')) || []).filter(record => record.end_time !== null);
        localStorage.setItem('records', JSON.stringify(records));
        setRecords(records);
    }, []);

    /**
     * Get Days in Month
     * @param {number} month 
     * @param {number} year 
     * @returns {number}
     */
    const daysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    }

    /**
     * Get Date Full Counter
     * @param {Date} date1 
     * @param {Date} date2 
     * @returns {string}
     */
    // const getDateFullCounter = (date1, date2) => {
    //     let d = Math.abs(date2 - date1) / 1000;
    //     let r = {};
    //     const s = {
    //         // year: 31536000,
    //         // month: 2592000,
    //         // week: 604800,
    //         // day: 86400,
    //         hour: 3600,
    //         minute: 60,
    //         second: 1
    //     };
    //     Object.keys(s).forEach(function(key){
    //         r[key] = Math.floor(d / s[key]);
    //         d -= r[key] * s[key];
    //     });
    //     return `${r.hour > 9 ? r.hour : `0${r.hour}`}:${r.minute > 9 ? r.minute : `0${r.minute}`}:${r.second > 9 ? r.second : `0${r.second}`}`;
    // };

    /**
     * Add Record
     */
    const addRecord = () => {
        const uuid = uuidv4();
        records.push({
            id: uuid,
            ...formValues,
        });
        localStorage.setItem('records', JSON.stringify(records));
        setFormValues(formInitialValues);
    };

    /**
     * Add Record for Start or Stop
     */
    const addRecordStartOrStop = () => {
        setIsStart(!isStart);
        if (!isStart) {
            const uuid = uuidv4();
            setStartUUID(uuid);
            records.push({
                id: uuid,
                start_time: new Date(),
                end_time: null,
            });
            localStorage.setItem('records', JSON.stringify(records));
        } else {
            const recordIndex = (JSON.parse(localStorage.getItem('records')) || []).findIndex(record => record.id === startUUID);
            if (records[recordIndex]) {
                records[recordIndex].end_time = new Date();
                localStorage.setItem('records', JSON.stringify(records));
            }
        }
    };

    /**
     * Table Handle Change
     * @param {*} id 
     * @param {*} key 
     * @param {*} value 
     */
    const handleChangeTable = (id, key, value) => {
        let nextData = Object.assign([], records);
        nextData.find(item => item.id === id)[key] = value;
        setRecords(nextData);
        nextData = nextData.map(data => {
            return {
                id: data.id,
                start_time: data.start_time,
                end_time: data.end_time
            };
        });
        localStorage.setItem('records', JSON.stringify(nextData));
    };

    /**
     * Table Handle Edit State
     * @param {*} id 
     */
    const handleEditStateTable = id => {
        const nextData = Object.assign([], records);
        const activeItem = nextData.find(item => item.id === id);
        activeItem.status = activeItem.status ? null : 'EDIT';
        setRecords(nextData);
    };

    /**
     * Table Action Cell Component
     */
    const ActionCell = ({
        rowData,
        dataKey,
        onClick,
        ...props
    }) => {
        return (
            <Table.Cell {...props} className="link-group">
                <IconButton appearance="subtle" onClick={() => {
                    onClick && onClick(rowData.id);
                }} icon={rowData.status === 'EDIT' ? <CheckIcon /> : <EditIcon />} />
                <IconButton appearance="subtle" onClick={() => {
                    let newRecords = records.filter(record => record.id !== rowData.id);
                    localStorage.setItem('records', JSON.stringify(newRecords));
                    setRecords(newRecords);
                }} icon={<TrashIcon />} />
            </Table.Cell>
        );
    };

    /**
     * Table Edit Cell Component
     */
    const EditCell = ({
        rowData,
        dataKey,
        onChange,
        ...props
    }) => {
        const editing = rowData.status === 'EDIT';
        return (
            <Table.Cell {...props} className={editing ? 'table-content-editing' : ''}>
                {editing ? (
                    <DatePicker
                        format="yyyy-MM-dd HH:mm"
                        defaultValue={new Date(rowData[dataKey])}
                        calendarDefaultDate={new Date(rowData[dataKey])}
                        onChange={(value, event) => {
                            onChange && onChange(rowData.id, dataKey, value);
                        }}
                    />
                ) : (
                    <span className="table-content-edit-span">{new Date(rowData[dataKey]).toLocaleString('en-US', {
                        hour12: false
                    })}</span>
                )}
            </Table.Cell>
        );
    };

    /**
     * Render
     */
    return (
        <Container>
            <Content>
                <Grid>
                    <Button color="blue" size="lg" appearance="primary" block onClick={addRecordStartOrStop}>
                        {isStart ? <PauseIcon /> : <PlayIcon />} {isStart ? 'Stop' : 'Start'}
                    </Button>
                    <Divider>OR</Divider>
                    <Form
                        fluid
                        onSubmit={addRecord}
                        formValue={formValues}
                        model={formModel}
                    >
                        <Row>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Group controlId="start_time">
                                    <Form.ControlLabel>Start Time</Form.ControlLabel>
                                    <Form.Control name="start_time" format="yyyy-MM-dd HH:mm" onChange={(value) => setFormValues({...formValues, start_time: value})} accepter={DatePicker} block />
                                </Form.Group>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Group controlId="end_time">
                                    <Form.ControlLabel>End Time</Form.ControlLabel>
                                    <Form.Control name="end_time" format="yyyy-MM-dd HH:mm" onChange={(value) => setFormValues({...formValues, end_time: value})} accepter={DatePicker} block />
                                </Form.Group>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Button type="submit" color="blue" size="md" appearance="primary" block style={{ marginTop: 25 }}>Add</Button>
                            </Col>
                        </Row>
                    </Form>
                    <Divider style={{ marginTop: 50 }} />
                    <div id="table-container">
                        <Table
                            height={400}
                            rowHeight={60}
                            data={records.filter(record => record.end_time !== null).slice(page > 1 ? (page - 1) * limit : 0, page > 1 ? page * limit : limit)}
                        >
                            <Table.Column width={50} fixed>
                                <Table.HeaderCell>ID</Table.HeaderCell>
                                <Table.Cell dataKey="id" />
                            </Table.Column>
                            <Table.Column flexGrow={1} fixed>
                                <Table.HeaderCell>Start Time</Table.HeaderCell>
                                <EditCell dataKey="start_time" onChange={handleChangeTable}></EditCell>
                            </Table.Column>
                            <Table.Column flexGrow={1} fixed>
                                <Table.HeaderCell>End Time</Table.HeaderCell>
                                <EditCell dataKey="end_time" onChange={handleChangeTable}></EditCell>
                            </Table.Column>
                            <Table.Column flexGrow={1} fixed>
                                <Table.HeaderCell>Operations</Table.HeaderCell>
                                <ActionCell dataKey="id" onClick={handleEditStateTable} />
                            </Table.Column>
                        </Table>
                        <div style={{ padding: 20 }}>
                            <Pagination
                                prev
                                next
                                first
                                last
                                ellipsis
                                boundaryLinks
                                maxButtons={5}
                                size="md"
                                layout={['total', '-', 'limit', '|', 'pager']}
                                total={records.length}
                                limitOptions={[10, 20, 30, 40, 50, 100, 200]}
                                limit={limit}
                                activePage={page}
                                onChangePage={(page) => setPage(page > 0 ? page : 1)}
                                onChangeLimit={(limit) => {
                                    setLimit(limit);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                    {chartData && (
                        <>
                            <Divider style={{ marginTop: 50 }} />
                            <div id="chart-container">
                                <div className="chart-header-options">
                                    <SelectPicker data={[{
                                        label: 'Days',
                                        value: 'days'
                                    }, {
                                        label: 'Months',
                                        value: 'months'
                                    }]} defaultValue={chartType} onChange={(value) => setChartType(value)} />
                                    {chartType === 'days' && (
                                        <SelectPicker data={monthNames.map((month, index) => ({
                                            label: month,
                                            value: index
                                        }))} defaultValue={chartMonth} onChange={(value) => setChartMonth(value)} />
                                    )}
                                    <SelectPicker data={[...Array(new Date().getFullYear() - 1989).keys()].map((e) => e + 1990).map(year => ({
                                        label: year,
                                        value: year
                                    }))} defaultValue={chartYear} onChange={(value) => setChartYear(value)} />
                                </div>
                                <Line options={chartOptions} data={chartData} />
                            </div>
                        </>
                    )}
                </Grid>
            </Content>
        </Container>
    );
}

export default App;