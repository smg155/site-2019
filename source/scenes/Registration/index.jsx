// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Loader from 'scenes/Loader';
import { getGithubOAuthURL } from 'services/api/auth';
import { getRegistrationData } from 'services/registration/actions';
import FormContext from './FormContext';
import SideBar from './components/SideBar';
import ScrollableForm from './components/Form';
import required from './components/Form/required';
import './styles.scss';

import type { RegistrationData } from './FormContext';

type Props = {
  jwt: ?string,
  regValid: boolean,
  regData: ?Object,
  checkRegistration: () => void,
};

type State = {
  pane: number,
  data: RegistrationData,
  errors: { [string]: boolean },
};

const INITIAL_REGISTRATION_STATE = {
  school: -1,
  major: '',
  graduationYear: '',
  shirtSize: -1,
  transportation: -1,
  diet: [],
  phone: '',
  age: '',
  gender: -1,
  isBeginner: -1,
  linkedin: '',
  resume: null,
  interests: [],
  skills: '',
  priorAttendance: -1,
  extraInfo: '',
  teamMembers: '',
  versionControl: -1,
  pullRequest: -1,
  yearsExperience: '',
  technicalSkills: '',
};

class Registration extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      pane: 0,
      data: INITIAL_REGISTRATION_STATE,
      errors: {},
    };

    this.initializeState = this.initializeState.bind(this);
    this.setPane = this.setPane.bind(this);
    this.registerField = this.registerField.bind(this);
  }

  componentDidMount() {
    const { regValid, regData, checkRegistration, jwt } = this.props;
    if (jwt) {
      if (regValid) {
        this.initializeState(regData);
      } else {
        checkRegistration();
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Check for registration request to go from invalid to valid
    const { regValid, regData } = this.props;
    if (!prevProps.regValid && regValid) {
      this.initializeState(regData);
    }
  }

  setPane: number => void;
  setPane(newPane: number) {
    this.setState(prevState => {
      const { data, pane, errors } = prevState;
      const missing = required(pane, data);
      if (missing.length === 0 || newPane < pane) {
        return { pane: newPane };
      }

      const e = {};
      missing.forEach(field => {
        e[field] = true;
      });
      return { errors: Object.assign({}, errors, e) };
    });
  }

  initializeState: (?Object) => void;
  initializeState(regData) {
    if (regData !== null) {
      this.setState({
        data: regData,
      });
    }
  }

  registerField: (string, ?(string) => boolean) => string => void;
  registerField(field: string, validator?: string => boolean) {
    return (value: string) => {
      const { data } = this.state;
      if (!(field in data)) {
        throw new Error(`${field} missing from Form state`);
      }
      this.setState(prevState => {
        const d = {};
        d[field] = value;
        const e = {};
        if (validator === undefined) {
          e[field] = false;
        } else {
          e[field] = !validator(value);
        }
        return {
          data: Object.assign({}, prevState.data, d),
          errors: Object.assign({}, prevState.errors, e),
        };
      });
    };
  }

  render() {
    const { jwt, regValid } = this.props;
    const { pane, data, errors } = this.state;

    if (!jwt) {
      window.location.replace(getGithubOAuthURL('/register'));
      return null;
    }
    if (!regValid) {
      return <Loader />;
    }
    return (
      <div className="registration">
        <SideBar pane={pane} setPane={this.setPane} />
        <FormContext.Provider value={{ data, errors, registerField: this.registerField }}>
          <ScrollableForm pane={pane} setPane={this.setPane} />
        </FormContext.Provider>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  jwt: state.auth.jwt,
  regValid: state.registration.valid,
  regData: state.registration.data,
});

const mapDispatchToProps = dispatch => ({
  checkRegistration: () => dispatch(getRegistrationData()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Registration);
