// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { FilterDrawerComponent } from './FilterDrawerComponent';
// import { DataService } from '../../../../core/services/DataService';
// import { FormsModule } from '@angular/forms';
// import { signal } from '@angular/core';
// import {Drawer} from 'primeng/drawer';
// import {DatePicker} from 'primeng/datepicker';
// import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
//
// // Mock DataService
// const mockDataService = {
//   setDateRange: jest.fn()
// };
//
// describe.skip('FilterDrawerComponent', () => {
//   let component: FilterDrawerComponent;
//   let fixture: ComponentFixture<FilterDrawerComponent>;
//   let dataService: DataService;
//
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [FormsModule, FilterDrawerComponent],
//       providers: [
//         { provide: DataService, useValue: mockDataService }
//       ]
//     })
//       .overrideComponent(FilterDrawerComponent, {
//         remove: { imports: [Drawer, DatePicker, ButtonDirective, ButtonIcon, ButtonLabel] },
//         add: { imports: [] }
//       })
//       .compileComponents();
//
//     fixture = TestBed.createComponent(FilterDrawerComponent);
//     component = fixture.componentInstance;
//     dataService = TestBed.inject(DataService);
//
//     // Reset mocks before each test
//     jest.clearAllMocks();
//   });
//
//   it('should create the component', () => {
//     expect(component).toBeTruthy();
//   });
//
//   describe('Input Properties', () => {
//
//     it('should accept visible signal input', () => {
//       const visibleSignal = signal(false);
//       component.visible = visibleSignal;
//       fixture.detectChanges();
//
//       expect(component.visible).toBe(visibleSignal);
//     });
//
//     it('should accept dataType input', () => {
//       const testDataType = 'daily-rollups';
//       component.dataType = testDataType;
//       fixture.detectChanges();
//
//       expect(component.dataType).toBe(testDataType);
//     });
//   });
//
//
//
//   describe('Output Events', () => {
//
//
//     it('should emit visibleChange event when visible signal changes', fakeAsync(() => {
//       const visibleChangeSpy = jest.spyOn(component.visibleChange, 'emit');
//       const visibleSignal = signal(true);
//
//       component.visible = visibleSignal;
//       fixture.detectChanges();
//
//       // Simulate signal change
//       visibleSignal.set(false);
//       tick();
//
//       expect(visibleChangeSpy).toHaveBeenCalledWith(visibleSignal);
//     }));
//   });
//
// });
