import { createLocalVue, mount, shallowMount, Wrapper } from '@vue/test-utils';
import Vuex from 'vuex';

import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline } from '@/lib/steps';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    const steps = wrapper.findAll('step-stub');
    expect(steps.length).toEqual(3);
    const [step1, step2, step3] = steps.wrappers.map(stub => stub.props());
    expect(step1).toEqual({
      step: pipeline[0],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: true,
      isLast: false,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 0,
    });
    expect(step2).toEqual({
      step: pipeline[1],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: false,
      isLast: false,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 1,
    });
    expect(step3).toEqual({
      step: pipeline[2],
      isActive: false,
      isLastActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 2,
    });
  });

  it('should render a container with tips', () => {
    const pipeline: Pipeline = [{ name: 'domain', domain: 'GoT' }];
    const store = setupMockStore({ pipeline });
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    expect(wrapper.find('.query-pipeline__tips').text()).toEqual(
      'Interact with the widgets and table on the right to add steps',
    );
    expect(wrapper.find('.fa-magic').exists()).toBeTruthy();
  });

  describe('toggle delete step', () => {
    let wrapper: Wrapper<PipelineComponent>, stepToDelete: Wrapper<any>;
    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = shallowMount(PipelineComponent, { store, localVue });
      const steps = wrapper.findAll('step-stub');
      stepToDelete = steps.at(1);
      stepToDelete.vm.$emit('toggleDelete');
      await wrapper.vm.$nextTick();
    });

    it('should add step index to steps to delete', () => {
      expect((wrapper.vm as any).stepsToDelete).toContain(1);
    });
    it('should apply delete class to step', () => {
      expect(stepToDelete.props().toDelete).toBe(true);
    });

    describe('when already selected', () => {
      beforeEach(async () => {
        stepToDelete.vm.$emit('toggleDelete');
        await wrapper.vm.$nextTick();
      });
      it('should remove step index from step to delete', () => {
        expect((wrapper.vm as any).stepsToDelete).not.toContain(1);
      });
      it('should remove delete class from step', () => {
        expect(stepToDelete.props().toDelete).toBe(false);
      });
    });

    describe('when there is steps selected', () => {
      beforeEach(async () => {
        wrapper.setData({ stepsToDelete: [1, 2] });
        await wrapper.vm.$nextTick();
      });
      it('should show the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps-container').exists()).toBe(true);
      });
      it('should display the number of selected steps into the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps').text()).toContain(
          'Delete [2] selected',
        );
      });
      it('should make steps uneditable', () => {
        const steps = wrapper.findAll('step-stub');
        steps.wrappers.map(stub => expect(stub.props().isEditable).toBe(false));
      });
    });

    describe('when there is no steps to delete', () => {
      beforeEach(async () => {
        wrapper.setData({ stepsToDelete: [] });
        await wrapper.vm.$nextTick();
      });
      it('should hide the delete steps button', () => {
        expect(wrapper.find('.qquery-pipeline__delete-steps-container').exists()).toBe(false);
      });
    });
  });

  it('does not render a delete confirmation modal by default', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'rename', toRename: [['foo', 'bar']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBe(false);
  });

  describe('clicking on the delete button', () => {
    let wrapper: Wrapper<PipelineComponent>, modal: Wrapper<any>, dispatchSpy: jest.SpyInstance;
    const stepsToDelete = [1, 2];

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore(buildStateWithOnePipeline(pipeline));
      dispatchSpy = jest.spyOn(store, 'dispatch');
      wrapper = mount(PipelineComponent, { store, localVue });
      wrapper.setData({ stepsToDelete });
      wrapper.find('.query-pipeline__delete-steps').trigger('click');
      await wrapper.vm.$nextTick();
      modal = wrapper.find(DeleteConfirmationModal);
    });

    it('should render a delete confirmation modal', async () => {
      expect(modal.exists()).toBe(true);
    });

    describe('when cancel confirmation', () => {
      beforeEach(async () => {
        modal.find('.vqb-modal__action--secondary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should not delete the selected steps', () => {
        expect(dispatchSpy).not.toHaveBeenCalled();
      });
      it('should keep the selected steps unchanged', () => {
        expect((wrapper.vm as any).stepsToDelete).toStrictEqual(stepsToDelete);
      });
    });

    describe('when validate', () => {
      beforeEach(async () => {
        modal.find('.vqb-modal__action--primary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should delete the selected steps', () => {
        expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('deleteSteps'), {
          indexes: stepsToDelete,
        });
      });
      it('should clean the selected steps', () => {
        expect((wrapper.vm as any).stepsToDelete).toStrictEqual([]);
      });
    });
  });

  describe('reorder steps', () => {
    let wrapper: Wrapper<PipelineComponent>,
      commitSpy: jest.SpyInstance,
      dispatchSpy: jest.SpyInstance;

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        { name: 'sort', columns: [{ column: 'death', order: 'desc' }] },
      ];
      const store = setupMockStore(buildStateWithOnePipeline(pipeline));
      commitSpy = jest.spyOn(store, 'commit');
      dispatchSpy = jest.spyOn(store, 'dispatch');
      wrapper = shallowMount(PipelineComponent, { store, localVue });
    });

    it('should have a draggable steps list as pipeline', () => {
      expect(wrapper.find('Draggable-stub').exists()).toBe(true);
    });
    it('should rerender pipeline when steps position are updated', async () => {
      const reorderedPipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'desc' }] },
      ];
      wrapper.find('draggable-stub').vm.$emit('input', reorderedPipeline); // fake drag/drop step action
      await wrapper.vm.$nextTick();
      expect(commitSpy).toHaveBeenCalledWith(
        VQBnamespace('setPipeline'),
        { pipeline: reorderedPipeline },
        undefined,
      );
    });
    it('should reselect step based on new index if dropped step was already selected one', async () => {
      wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 3, newIndex: 1 }); // fake drop end action
      expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('selectStep'), { index: 1 });
    });
    it('should not reselect step if selected step index has not changed', async () => {
      wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 3, newIndex: 3 }); // fake drop end action
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
    describe('balance step index when amount of steps before/after has changed', () => {
      beforeEach(() => {
        // fake move current selected step to middle of pipeline
        wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 3, newIndex: 1 });
      });
      it('should balance with more items before selected step', () => {
        // Before: [1, current, 3, 4] : current = 1
        // After: [1, 3, current, 4] : current = 2
        wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 2, newIndex: 1 });
        expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('selectStep'), { index: 2 });
      });
      it('should balance with more items after selected step', () => {
        // Before: [1, current, 3, 4] : current = 1
        // After: [current, 3, 1, 4] : current = 0
        wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 0, newIndex: 2 });
        expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('selectStep'), { index: 0 });
      });
      it('should keep unchanged with same quantity', () => {
        // Before: [1, current, 3, 4] : current = 1
        // After: [1, current, 4, 3] : current = 1
        wrapper.find('draggable-stub').vm.$emit('end', { oldIndex: 2, newIndex: 3 });
        expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('selectStep'), { index: 1 });
      });
    });
  });
});
