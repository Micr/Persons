import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'
import './App.css'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';

const Home = () => (
  <div>
    <h2 className="home-header">Home</h2>
  </div>
)

class Persons extends Component {
  constructor(props) {
    super(props)
    this.state = {
      persons: [],
      groups: {},
      groupsSortProperties: {},
      scrollTop: window.scrollY,
      modal: false,
      sortBy: null,
      sortDir: 'asc',
      showByGroups: false,
      addUser: {
        first_name: '',
        last_name: '',
        group: ''
      }
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.addUser = this.addUser.bind(this)
  }
  componentWillMount() {
    fetch('api/MOCK_DATA.json')
      .then(function(response) {
        return response.json()
    }).then((persons) => {
        const groups = persons.reduce((memo, next) => {
          const group = next.group === null ? 'no' : next.group
          memo[group] = memo[group] || []
          memo[group].push(next)
          return memo
        }, {})
        const groupsSortProperties = Object.keys(groups).reduce((memo, next) => {
          memo[next] = {
            sortBy: null,
            sortDir: 'asc'
          }
          return memo
        }, {})
        this.setState({ persons, groups, groupsSortProperties })
      }).catch(function(ex) {
        console.log('parsing failed', ex)
    });
  }
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }
  handleScroll() {
    this.setState({ scrollTop: window.scrollY })
  }
  sort(key, group) {
    let sortDir = group ? this.state.groupsSortProperties[group].sortDir : this.state.sortDir
    const sortBy = key
    if (group) {
      if (sortBy === this.state.groupsSortProperties[group].sortBy) {
        sortDir = this.state.groupsSortProperties[group].sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        sortDir = 'asc'
      }
    } else {
      if (sortBy === this.state.sortBy) {
        sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        sortDir = 'asc'
      }
    }
    let rows;
    if (group) {
      rows = this.state.groups[group].slice()
    } else {
      rows = this.state.persons.slice()
    }
    rows.sort((a, b) => {
      let sortVal = 0
      if (a[sortBy] > b[sortBy]) {
        sortVal = 1
      }
      if (a[sortBy] < b[sortBy]) {
        sortVal = -1
      }

      if (sortDir === 'desc') {
        sortVal *= -1
      }
      return sortVal
    });

    if (group) {
      this.setState({ groupsSortProperties: {
        ...this.state.groupsSortProperties,
        [group]: {
          sortDir, sortBy
        }
      }, groups: { ...this.state.groups, [group]: rows }})
    } else {
      this.setState({sortBy, sortDir, persons: rows})
    }
  }
  handleChange(event) {
    this.setState({
      addUser: {
        ...this.state.addUser, [event.target.name]: event.target.value
      }
    })
  }
  addUser(event) {
    event.preventDefault()
    const addUser = { ...this.state.addUser, id: Date.now() }
    let persons
    let sortDir
    let sortBy
    const group = addUser.group || 'no'
    persons = this.state.groups[group]
    sortDir = this.state.groupsSortProperties[group].sortDir
    sortBy = this.state.groupsSortProperties[group].sortBy
    const groupPersons = this.insertPerson(persons, sortDir, sortBy, addUser)
    persons = this.state.persons
    sortDir = this.state.sortDir
    sortBy = this.state.sortBy
    persons = this.insertPerson(persons, sortDir, sortBy, addUser)
    this.setState({ persons, groups: { ...this.state.groups, [group]: groupPersons }, addUser: {} })
    this.handleClose()
    console.log(`Saving user: first name: ${this.state.addUser.first_name}, last name: ${this.state.addUser.last_name}, group: ${this.state.addUser.group}`)
  }
  insertPerson(persons, sortDir, sortBy, addUser) {
    if (sortBy === null) {
      persons.push(addUser)
    } else {
      persons.some((person, index) => {
        if (sortDir === 'asc' && addUser[sortBy] < person[sortBy]) {
          persons.splice(index, 0, addUser)
          return true
        } else if (sortDir === 'desc' && addUser[sortBy] > person[sortBy]) {
          persons.splice(index, 0, addUser)
          return true
        } else if (index === persons.length) {
          persons.push(addUser)
        }
      })
    }
    return persons;
  }
  handleClose() {
    this.setState({ modal: false })
  }
  renderByGroups() {
    let maxNumRows = 0;
    const rowStyle = {height: '48px'}
    const rowHeight = 49
    const availHeight = window.innerHeight
    const scrollTop = this.state.scrollTop
    const scrollBottom = scrollTop + availHeight

    const groups = Object.keys(this.state.groups).map((key) => {
      const numRows = this.state.groups[key].length
      maxNumRows = Math.max(numRows, maxNumRows)
      const startIndex = Math.max(0, Math.floor(scrollTop/rowHeight) - 20)
      const endIndex = Math.min(numRows, Math.ceil(scrollBottom/rowHeight) + 20)
      const items = []
      let index = startIndex
      if (this.state.persons.length) {
        while (index < endIndex) {
          const person = this.state.groups[key][index];
          items.push(
            <tr key={person.id} style={rowStyle}>
              <td>{person.first_name}</td>
              <td>{person.last_name}</td>
            </tr>
          )
          index++
        }
      }
      return (
        <div key={key} style={{float: 'left', width: '20%'}}>
          <div style={{height: startIndex * rowHeight }}/>
            <div style={{textAlign: 'center'}}>{key}</div>
            <table>
              <thead>
                <tr style={rowStyle}>
                  <th style={rowStyle} onClick={() => this.sort('first_name', key)}>first name</th>
                  <th style={rowStyle} onClick={() => this.sort('last_name', key)}>last name</th>
                </tr>
              </thead>
              <tbody>
                {items}
              </tbody>
            </table>
        </div>
      )
    })
    return (
      <div style={{height: maxNumRows * rowHeight}}>
          {groups}
      </div>
    )
  }
  renderAll() {
    const rowStyle = {height: '48px'}
    const rowHeight = 49
    const numRows = this.state.persons.length
    const totalHeight = numRows * rowHeight
    const availHeight = window.innerHeight
    const scrollTop = this.state.scrollTop
    const scrollBottom = scrollTop + availHeight
    const startIndex = Math.max(0, Math.floor(scrollTop/rowHeight) - 20)
    const endIndex = Math.min(numRows, Math.ceil(scrollBottom/rowHeight) + 20)
    const items = []
    let index = startIndex
    if (this.state.persons.length) {
      while (index < endIndex) {
        const person = this.state.persons[index];
        items.push(
          <tr key={person.id} style={rowStyle}>
            <td>{person.first_name}</td>
            <td>{person.last_name}</td>
            <td>{person.group === null ? '' : person.group}</td>
          </tr>
        )
        index++
      }
    }
    return (
      <div style={{height: totalHeight}}>
        <div style={{height: startIndex * rowHeight }}/>
        <table style={{width: '100%'}}>
          <thead>
            <tr style={rowStyle}>
              <th style={rowStyle} onClick={() => this.sort('first_name')}>{`first name`}</th>
              <th style={rowStyle} onClick={() => this.sort('last_name')}>{`last name`}</th>
              <th style={rowStyle} onClick={() => this.sort('group')}>{`group`}</th>
            </tr>
          </thead>
          <tbody>
            {items}
          </tbody>
        </table>
      </div>
    )
  }
  render() {
    const actions = [
      <RaisedButton
        label="add"
        primary={true}
        onClick={this.addUser}
      />
    ]
    const content = this.state.showByGroups ? this.renderByGroups() : this.renderAll();
    return (
      <div>
          <RaisedButton
            label="Add user"
            style={{position: 'fixed', bottom: 10, right: 10 }}
            primary={true}
            onClick={() => this.setState({ modal: true })}
          />
          <div style={{marginBottom: 10}}>
            <FlatButton
              label="Show by groups"
              primary={true}
              onClick={() => this.setState({ showByGroups: true })}
            />
            <FlatButton
              label="Show all"
              primary={true}
              onClick={() => this.setState({ showByGroups: false })}
            />
          </div>
        {content}
        <Dialog
          title="Add user"
          actions={actions}
          open={this.state.modal}
          contentStyle={{textAlign: 'center'}}
          onRequestClose={this.handleClose}
        >
          <div style={{display: 'inline-block'}}>
              <TextField
                style={{display: 'block'}}
                hintText="First Name"
                name="first_name"
                onChange={this.handleChange}
              />
              <TextField
                style={{display: 'block'}}
                hintText="Last Name"
                name="last_name"
                onChange={this.handleChange}
              />
              <TextField
                style={{display: 'block'}}
                hintText="Group(1,2,3,4,no)"
                name="group"
                onChange={this.handleChange}
              />
          </div>
        </Dialog>
      </div>
    )
  }
}

const App = () => (
  <MuiThemeProvider>
    <Router>
      <div>
        <ul className="navigation">
          <li><Link to="/" style={{ textDecoration: 'none' }}><FlatButton primary={true} label="home"/></Link></li>
          <li><Link to="/persons" style={{ textDecoration: 'none' }}><FlatButton primary={true} label="persons"/></Link></li>
        </ul>

        <hr/>

        <Route exact path="/" component={Home}/>
        <Route path="/persons" component={Persons}/>
      </div>
    </Router>
  </MuiThemeProvider>
)

export default App
