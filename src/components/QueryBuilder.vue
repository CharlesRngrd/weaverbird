<template>
  <div class="query-builder" data-cy="weaverbird-query-builder" v-if="pipeline">
    <transition v-if="isEditingStep" name="slide-right" mode="out-in">
      <component
        key="stepForm"
        :is="formComponent"
        ref="step"
        :initialStepValue="stepFormInitialValue"
        :stepFormDefaults="stepFormDefaults"
        :isStepCreation="isStepCreation"
        :backendError="editedStepBackendError"
        @back="closeStepForm"
        @formSaved="saveStep"
      />
    </transition>
    <transition v-else name="slide-left" mode="out-in">
      <div>
        <div class="documentation-help">
          <a
            href="https://weaverbird.toucantoco.com/docs/general-principles/"
            target="_blank"
            rel="noopener"
            class="documentation-help__content"
            :data-version="version"
          >
            <FAIcon icon="question-circle" />
            <p>Need help?</p>
          </a>
        </div>
        <Pipeline key="pipeline" @editStep="editStep" />
      </div>
    </transition>
  </div>
  <div class="query-builder query-builder--no-pipeline" v-else>Select a pipeline...</div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { VQBState } from '@/store/state';

import { version } from '../../package.json';
import StepFormsComponents from './stepforms';

@Component({
  name: 'query-builder',
  components: {
    Pipeline: PipelineComponent,
    FAIcon,
  },
})
export default class QueryBuilder extends Vue {
  version = version; // display the current version of the package
  editedStepBackendError: string | undefined = undefined;

  @VQBModule.State currentStepFormName!: PipelineStepName;
  @VQBModule.State stepFormInitialValue!: object;
  @VQBModule.State stepFormDefaults!: object;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter pipeline!: Pipeline;

  @VQBModule.Mutation closeStepForm!: () => void;
  @VQBModule.Mutation openStepForm!: (payload: {
    stepName: PipelineStepName;
    initialValue: object;
  }) => void;
  @VQBModule.Mutation resetStepFormInitialValue!: () => void;
  @VQBModule.Action setCurrentDomain!: (payload: Pick<VQBState, 'currentDomain'>) => void;
  @VQBModule.Action selectStep!: (payload: { index: number }) => void;
  @VQBModule.Mutation setPipeline!: (payload: { pipeline: Pipeline }) => void;
  @VQBModule.Getter stepErrors!: (index: number) => string | undefined;

  get isStepCreation() {
    return this.stepFormInitialValue === undefined;
  }

  get formComponent() {
    return StepFormsComponents[this.currentStepFormName];
  }

  editStep(params: PipelineStep, index: number) {
    // save the selected edited step error to avoid store to be refreshed with new data and lose it when entering the step form
    this.editedStepBackendError = this.stepErrors(index);
    this.openStepForm({ stepName: params.name, initialValue: params });
    const prevIndex = Math.max(index - 1, 0);
    this.selectStep({ index: prevIndex });
  }

  saveStep(step: PipelineStep) {
    const newPipeline: Pipeline = [...this.pipeline];
    // FIXME: not sure about that specific implem to handle `domain` step
    const index = step.name === 'domain' ? 0 : this.computedActiveStepIndex + 1;
    if (this.isStepCreation) {
      newPipeline.splice(index, 0, step);
    } else {
      newPipeline.splice(index, 1, step);
    }
    if (step.name === 'domain') {
      this.setCurrentDomain({ currentDomain: step.domain });
    } else {
      this.setPipeline({ pipeline: newPipeline });
      this.selectStep({ index });
    }
    this.closeStepForm();
    // Reset value from DataViewer
    this.resetStepFormInitialValue();
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.query-builder {
  @extend %main-font-style;
  ::v-deep *,
  ::v-deep ::after,
  ::v-deep ::before {
    box-sizing: border-box;
  }

  ::v-deep button {
    outline: none;
  }

  ::v-deep fieldset {
    border: none;
  }
}

.slide-left-enter,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-enter-active {
  transition: all 0.3s ease;
}

.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active {
  transition: all 0.3s ease;
}

.documentation-help {
  display: flex;
  justify-content: center;
  margin-top: -15px;
  margin-bottom: -10px;
}

.documentation-help__content {
  display: flex;
  align-items: center;
  font-size: 12px;
  text-decoration: none;
  color: $base-color;

  &:hover {
    color: $active-color;
  }

  p {
    text-decoration: underline;
  }

  ::v-deep .fa-question-circle {
    margin-right: 5px;
  }
}
</style>
